const { validationResult } = require('express-validator');
const db = require('../config/database');

const CATEGORIES = ['carburant','entretien','reparation','assurance','peage','parking','autre'];

// GET /api/vehicles/:vehicleId/expenses
exports.list = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  const { page = 1, limit = 20, year, month, category } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE e.vehicle_id = ?';
  const params = [vehicleId];

  if (year)     { where += ' AND YEAR(e.date) = ?';  params.push(year); }
  if (month)    { where += ' AND MONTH(e.date) = ?'; params.push(month); }
  if (category && CATEGORIES.includes(category)) {
    where += ' AND e.category = ?'; params.push(category);
  }

  const limitInt  = parseInt(limit);
  const offsetInt = parseInt(offset);

  try {
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM expenses e ${where}`, params
    );
    const [rows] = await db.execute(
      `SELECT e.*, u.first_name, u.last_name FROM expenses e
       INNER JOIN users u ON u.id = e.user_id
       ${where} ORDER BY e.date DESC, e.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`,
      params
    );
    res.json({ data: rows, total, page: parseInt(page), limit: limitInt });
  } catch (err) {
    console.error('[Expense] list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/vehicles/:vehicleId/expenses
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { vehicleId } = req.vehicleAccess;
  const { date, category, amount, mileage_at_expense, fuel_liters, notes } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO expenses (vehicle_id, user_id, date, category, amount, mileage_at_expense, fuel_liters, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleId, req.user.id, date, category, amount,
       mileage_at_expense || null, fuel_liters || null, notes || null]
    );

    // Mettre à jour le kilométrage du véhicule si supérieur
    if (mileage_at_expense) {
      await db.execute(
        'UPDATE vehicles SET mileage = GREATEST(mileage, ?) WHERE id = ?',
        [mileage_at_expense, vehicleId]
      );
    }

    const [rows] = await db.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/vehicles/:vehicleId/expenses/:id
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { vehicleId } = req.vehicleAccess;
  const expenseId = parseInt(req.params.id);
  const { date, category, amount, mileage_at_expense, fuel_liters, notes } = req.body;

  try {
    const [existing] = await db.execute(
      'SELECT id FROM expenses WHERE id = ? AND vehicle_id = ?', [expenseId, vehicleId]
    );
    if (!existing.length) return res.status(404).json({ error: 'Dépense introuvable' });

    await db.execute(
      `UPDATE expenses SET date=?, category=?, amount=?, mileage_at_expense=?, fuel_liters=?, notes=?
       WHERE id=?`,
      [date, category, amount, mileage_at_expense || null, fuel_liters || null, notes || null, expenseId]
    );
    const [rows] = await db.execute('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/vehicles/:vehicleId/expenses/:id
exports.remove = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  const expenseId = parseInt(req.params.id);

  try {
    const [result] = await db.execute(
      'DELETE FROM expenses WHERE id = ? AND vehicle_id = ?', [expenseId, vehicleId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Dépense introuvable' });
    res.json({ message: 'Dépense supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
