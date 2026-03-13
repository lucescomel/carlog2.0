const db = require('../config/database');

// GET /api/vehicles/:vehicleId/stats
exports.vehicleStats = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  const year = req.query.year || new Date().getFullYear();

  try {
    // Total distances & km annuels
    const [[distances]] = await db.execute(
      `SELECT
        COALESCE(SUM(distance), 0) AS total_km,
        COALESCE(SUM(CASE WHEN YEAR(date) = ? THEN distance ELSE 0 END), 0) AS km_this_year,
        COALESCE(SUM(CASE WHEN trip_type = 'professionnel' AND YEAR(date) = ? THEN distance ELSE 0 END), 0) AS km_pro_this_year,
        COALESCE(SUM(CASE WHEN trip_type = 'personnel' AND YEAR(date) = ? THEN distance ELSE 0 END), 0) AS km_perso_this_year,
        COUNT(*) AS trip_count
       FROM trips WHERE vehicle_id = ?`,
      [year, year, year, vehicleId]
    );

    // Total & dépenses par catégorie (année) — expenses + maintenance
    const [expensesByCategory] = await db.execute(
      `SELECT category, SUM(total) AS total FROM (
         SELECT category, COALESCE(SUM(amount), 0) AS total
         FROM expenses WHERE vehicle_id = ? AND YEAR(date) = ?
         GROUP BY category
         UNION ALL
         SELECT type AS category, COALESCE(SUM(cost), 0) AS total
         FROM maintenance WHERE vehicle_id = ? AND YEAR(date) = ? AND cost IS NOT NULL
         GROUP BY type
       ) combined GROUP BY category`,
      [vehicleId, year, vehicleId, year]
    );

    const [[totals]] = await db.execute(
      `SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM expenses   WHERE vehicle_id = ? AND YEAR(date) = ?) +
        (SELECT COALESCE(SUM(cost),   0) FROM maintenance WHERE vehicle_id = ? AND YEAR(date) = ? AND cost IS NOT NULL)
          AS total_expenses,
        (SELECT COALESCE(SUM(amount),     0) FROM expenses WHERE vehicle_id = ? AND YEAR(date) = ? AND category = 'carburant') AS fuel_cost,
        (SELECT COALESCE(SUM(fuel_liters),0) FROM expenses WHERE vehicle_id = ? AND YEAR(date) = ? AND category = 'carburant') AS total_liters`,
      [vehicleId, year, vehicleId, year, vehicleId, year, vehicleId, year]
    );

    // Évolution mensuelle des dépenses (12 mois) — expenses + maintenance
    const [monthlyExpenses] = await db.execute(
      `SELECT month, SUM(total) AS total FROM (
         SELECT MONTH(date) AS month, COALESCE(SUM(amount), 0) AS total
         FROM expenses WHERE vehicle_id = ? AND YEAR(date) = ?
         GROUP BY MONTH(date)
         UNION ALL
         SELECT MONTH(date) AS month, COALESCE(SUM(cost), 0) AS total
         FROM maintenance WHERE vehicle_id = ? AND YEAR(date) = ? AND cost IS NOT NULL
         GROUP BY MONTH(date)
       ) combined GROUP BY month ORDER BY month`,
      [vehicleId, year, vehicleId, year]
    );

    // Évolution mensuelle des km
    const [monthlyKm] = await db.execute(
      `SELECT MONTH(date) AS month, COALESCE(SUM(distance), 0) AS total
       FROM trips WHERE vehicle_id = ? AND YEAR(date) = ?
       GROUP BY MONTH(date) ORDER BY month`,
      [vehicleId, year]
    );

    // Dernier entretien par type
    const [lastMaintenance] = await db.execute(
      `SELECT type, MAX(date) AS last_date, MAX(mileage) AS last_mileage
       FROM maintenance WHERE vehicle_id = ?
       GROUP BY type`,
      [vehicleId]
    );

    // Calculs dérivés — seuil min 50 km pour éviter des valeurs aberrantes
    const totalKm   = parseFloat(distances.km_this_year) || 0;
    const totalExp  = parseFloat(totals.total_expenses) || 0;
    const costPerKm = totalKm >= 50 ? (totalExp / totalKm).toFixed(3) : null;
    const avgConsumption = (totalKm >= 50 && parseFloat(totals.total_liters) > 0)
      ? ((parseFloat(totals.total_liters) / totalKm) * 100).toFixed(2)
      : null;

    res.json({
      year,
      distances,
      expensesByCategory,
      totals: { ...totals, costPerKm, avgConsumption },
      monthlyExpenses: buildMonthlyArray(monthlyExpenses),
      monthlyKm:       buildMonthlyArray(monthlyKm),
      lastMaintenance,
    });
  } catch (err) {
    console.error('[Stats] vehicleStats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/stats/dashboard
exports.dashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    // Nombre de véhicules
    const [[{ vehicle_count }]] = await db.execute(
      `SELECT COUNT(*) AS vehicle_count FROM vehicles
       WHERE owner_id = ? AND is_active = 1`, [userId]
    );

    // Total dépenses du mois courant — expenses + maintenance
    const [[{ month_expenses }]] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS month_expenses FROM (
         SELECT e.amount
         FROM expenses e
         INNER JOIN vehicles v ON v.id = e.vehicle_id
         WHERE v.owner_id = ? AND YEAR(e.date) = YEAR(NOW()) AND MONTH(e.date) = MONTH(NOW())
         UNION ALL
         SELECT m.cost AS amount
         FROM maintenance m
         INNER JOIN vehicles v ON v.id = m.vehicle_id
         WHERE v.owner_id = ? AND m.cost IS NOT NULL
           AND YEAR(m.date) = YEAR(NOW()) AND MONTH(m.date) = MONTH(NOW())
       ) combined`,
      [userId, userId]
    );

    // Total km du mois courant
    const [[{ month_km }]] = await db.execute(
      `SELECT COALESCE(SUM(t.distance), 0) AS month_km
       FROM trips t
       INNER JOIN vehicles v ON v.id = t.vehicle_id
       WHERE v.owner_id = ? AND YEAR(t.date) = YEAR(NOW()) AND MONTH(t.date) = MONTH(NOW())`,
      [userId]
    );

    // Dernières dépenses (5)
    const [recentExpenses] = await db.execute(
      `SELECT e.*, v.brand, v.model, v.registration
       FROM expenses e
       INNER JOIN vehicles v ON v.id = e.vehicle_id
       WHERE v.owner_id = ?
       ORDER BY e.date DESC, e.created_at DESC LIMIT 5`,
      [userId]
    );

    // Entretiens à venir (dans les 30 jours)
    const [upcomingMaintenance] = await db.execute(
      `SELECT m.*, v.brand, v.model, v.registration
       FROM maintenance m
       INNER JOIN vehicles v ON v.id = m.vehicle_id
       WHERE v.owner_id = ? AND m.next_date IS NOT NULL AND m.next_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
       ORDER BY m.next_date ASC LIMIT 5`,
      [userId]
    );

    res.json({ vehicle_count, month_expenses, month_km, recentExpenses, upcomingMaintenance });
  } catch (err) {
    console.error('[Stats] dashboard error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

function buildMonthlyArray(rows) {
  const arr = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
  rows.forEach(r => { arr[r.month - 1].total = parseFloat(r.total); });
  return arr;
}
