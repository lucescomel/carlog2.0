const { validationResult } = require('express-validator');
const db = require('../config/database');

// GET /api/vehicles/:vehicleId/trips
exports.list = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  const { page = 1, limit = 20, year, month, type } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE t.vehicle_id = ?';
  const params = [vehicleId];

  if (year)  { where += ' AND YEAR(t.date) = ?';  params.push(year); }
  if (month) { where += ' AND MONTH(t.date) = ?'; params.push(month); }
  if (type && ['personnel', 'professionnel'].includes(type)) {
    where += ' AND t.trip_type = ?'; params.push(type);
  }

  try {
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM trips t ${where}`, params
    );
    const [rows] = await db.execute(
      `SELECT t.*, u.first_name, u.last_name FROM trips t
       INNER JOIN users u ON u.id = t.user_id
       ${where} ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('[Trip] list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/vehicles/:vehicleId/trips
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { vehicleId } = req.vehicleAccess;
  const { date, distance, departure, arrival, trip_type, notes } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO trips (vehicle_id, user_id, date, distance, departure, arrival, trip_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleId, req.user.id, date, distance, departure || null, arrival || null,
       trip_type || 'personnel', notes || null]
    );
    const [rows] = await db.execute('SELECT * FROM trips WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/vehicles/:vehicleId/trips/:id
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { vehicleId } = req.vehicleAccess;
  const tripId = parseInt(req.params.id);
  const { date, distance, departure, arrival, trip_type, notes } = req.body;

  try {
    const [existing] = await db.execute(
      'SELECT id FROM trips WHERE id = ? AND vehicle_id = ?', [tripId, vehicleId]
    );
    if (!existing.length) return res.status(404).json({ error: 'Trajet introuvable' });

    await db.execute(
      `UPDATE trips SET date=?, distance=?, departure=?, arrival=?, trip_type=?, notes=?
       WHERE id=?`,
      [date, distance, departure || null, arrival || null, trip_type, notes || null, tripId]
    );
    const [rows] = await db.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/vehicles/:vehicleId/trips/:id
exports.remove = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  const tripId = parseInt(req.params.id);

  try {
    const [result] = await db.execute(
      'DELETE FROM trips WHERE id = ? AND vehicle_id = ?', [tripId, vehicleId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Trajet introuvable' });
    res.json({ message: 'Trajet supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
