const { validationResult } = require('express-validator');
const db = require('../config/database');

// GET /api/vehicles
exports.list = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT v.*,
              u.first_name AS owner_first_name, u.last_name AS owner_last_name,
              (v.owner_id = ?) AS is_owner,
              vs.permission AS share_permission
       FROM vehicles v
       INNER JOIN users u ON u.id = v.owner_id
       LEFT JOIN vehicle_shares vs ON vs.vehicle_id = v.id AND vs.shared_with_id = ?
       WHERE (v.owner_id = ? OR vs.shared_with_id = ?) AND v.is_active = 1
       ORDER BY v.created_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Vehicle] list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/vehicles/:id
exports.get = async (req, res) => {
  const { vehicleId } = req.vehicleAccess;
  try {
    const [rows] = await db.execute(
      `SELECT v.*, u.first_name AS owner_first_name, u.last_name AS owner_last_name
       FROM vehicles v
       INNER JOIN users u ON u.id = v.owner_id
       WHERE v.id = ?`,
      [vehicleId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Véhicule introuvable' });
    res.json({ ...rows[0], ...req.vehicleAccess });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/vehicles
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { brand, model, registration, year, mileage, fuel_type, color, notes } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO vehicles (owner_id, brand, model, registration, year, mileage, fuel_type, color, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, brand.trim(), model.trim(), registration.toUpperCase().trim(),
       year, mileage || 0, fuel_type, color || null, notes || null]
    );
    const [rows] = await db.execute('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Vehicle] create error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/vehicles/:id
exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { vehicleId } = req.vehicleAccess;
  const { brand, model, registration, year, mileage, fuel_type, color, notes } = req.body;

  try {
    await db.execute(
      `UPDATE vehicles SET brand=?, model=?, registration=?, year=?, mileage=?, fuel_type=?, color=?, notes=?
       WHERE id=?`,
      [brand.trim(), model.trim(), registration.toUpperCase().trim(),
       year, mileage, fuel_type, color || null, notes || null, vehicleId]
    );
    const [rows] = await db.execute('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/vehicles/:id  (soft delete)
exports.remove = async (req, res) => {
  const { vehicleId, isOwner } = req.vehicleAccess;
  if (!isOwner) return res.status(403).json({ error: 'Seul le propriétaire peut supprimer le véhicule' });

  try {
    await db.execute('UPDATE vehicles SET is_active = 0 WHERE id = ?', [vehicleId]);
    res.json({ message: 'Véhicule supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/vehicles/:id/shares
exports.getShares = async (req, res) => {
  const { vehicleId, isOwner } = req.vehicleAccess;
  if (!isOwner) return res.status(403).json({ error: 'Accès refusé' });

  try {
    const [rows] = await db.execute(
      `SELECT vs.id, vs.permission, vs.created_at,
              u.id AS user_id, u.email, u.first_name, u.last_name
       FROM vehicle_shares vs
       INNER JOIN users u ON u.id = vs.shared_with_id
       WHERE vs.vehicle_id = ?`,
      [vehicleId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/vehicles/:id/shares
exports.addShare = async (req, res) => {
  const { vehicleId, isOwner } = req.vehicleAccess;
  if (!isOwner) return res.status(403).json({ error: 'Accès refusé' });

  const { email, permission } = req.body;
  if (!email) return res.status(422).json({ error: 'Email requis' });

  try {
    const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!users.length) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const targetId = users[0].id;
    if (targetId === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas vous partager le véhicule' });

    await db.execute(
      `INSERT INTO vehicle_shares (vehicle_id, shared_with_id, permission) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE permission = VALUES(permission)`,
      [vehicleId, targetId, permission || 'view']
    );
    res.status(201).json({ message: 'Véhicule partagé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/vehicles/:id/shares/:shareId
exports.removeShare = async (req, res) => {
  const { vehicleId, isOwner } = req.vehicleAccess;
  if (!isOwner) return res.status(403).json({ error: 'Accès refusé' });

  const shareId = parseInt(req.params.shareId);
  try {
    await db.execute(
      'DELETE FROM vehicle_shares WHERE id = ? AND vehicle_id = ?',
      [shareId, vehicleId]
    );
    res.json({ message: 'Partage supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
