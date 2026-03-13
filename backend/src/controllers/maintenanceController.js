const { validationResult } = require('express-validator');
const db = require('../config/database');

// GET /api/vehicles/:vehicleId/maintenance
exports.list = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  const { page = 1, limit = 20, type } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE m.vehicle_id = ?';
  const params = [vehicleId];
  if (type) { where += ' AND m.type = ?'; params.push(type); }

  const limitInt  = parseInt(limit);
  const offsetInt = parseInt(offset);

  try {
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM maintenance m ${where}`, params
    );
    const [rows] = await db.execute(
      `SELECT m.*, u.first_name, u.last_name FROM maintenance m
       INNER JOIN users u ON u.id = m.user_id
       ${where} ORDER BY m.date DESC, m.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`,
      params
    );

    // Alertes entretiens à venir
    const [alerts] = await db.execute(
      `SELECT id, type, description, next_date, next_mileage
       FROM maintenance
       WHERE vehicle_id = ? AND (
         (next_date IS NOT NULL AND next_date <= DATE_ADD(NOW(), INTERVAL 30 DAY))
         OR (next_mileage IS NOT NULL)
       )
       ORDER BY next_date ASC LIMIT 5`,
      [vehicleId]
    );

    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit), alerts });
  } catch (err) {
    console.error('[Maintenance] list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/vehicles/:vehicleId/maintenance
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { vehicleId } = req.vehicleAccess;
  const { date, type, description, mileage, cost, next_date, next_mileage, garage, notes } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO maintenance (vehicle_id, user_id, date, type, description, mileage, cost, next_date, next_mileage, garage, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleId, req.user.id, date, type, description.trim(),
       mileage || null, cost || null, next_date || null, next_mileage || null,
       garage || null, notes || null]
    );

    // Mettre à jour le kilométrage du véhicule
    if (mileage) {
      await db.execute(
        'UPDATE vehicles SET mileage = GREATEST(mileage, ?) WHERE id = ?',
        [mileage, vehicleId]
      );
    }

    const [rows] = await db.execute('SELECT * FROM maintenance WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/vehicles/:vehicleId/maintenance/:id
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { vehicleId } = req.vehicleAccess;
  const maintenanceId = parseInt(req.params.id);
  const { date, type, description, mileage, cost, next_date, next_mileage, garage, notes } = req.body;

  try {
    const [existing] = await db.execute(
      'SELECT id FROM maintenance WHERE id = ? AND vehicle_id = ?', [maintenanceId, vehicleId]
    );
    if (!existing.length) return res.status(404).json({ error: 'Entretien introuvable' });

    await db.execute(
      `UPDATE maintenance SET date=?, type=?, description=?, mileage=?, cost=?, next_date=?, next_mileage=?, garage=?, notes=?
       WHERE id=?`,
      [date, type, description.trim(), mileage || null, cost || null,
       next_date || null, next_mileage || null, garage || null, notes || null, maintenanceId]
    );
    const [rows] = await db.execute('SELECT * FROM maintenance WHERE id = ?', [maintenanceId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/vehicles/:vehicleId/maintenance/:id
exports.remove = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  const maintenanceId = parseInt(req.params.id);

  try {
    const [result] = await db.execute(
      'DELETE FROM maintenance WHERE id = ? AND vehicle_id = ?', [maintenanceId, vehicleId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Entretien introuvable' });
    res.json({ message: 'Entretien supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
