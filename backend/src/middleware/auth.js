const jwt = require('jsonwebtoken');

/**
 * Middleware de vérification du token JWT (access token)
 * Le token est attendu dans le header Authorization: Bearer <token>
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

/**
 * Vérifie que l'utilisateur a accès à un véhicule donné (owner ou shared)
 * Injecte req.vehicleAccess = { vehicleId, isOwner, canEdit }
 */
const vehicleAccess = (allowEdit = false) => async (req, res, next) => {
  const db = require('../config/database');
  const vehicleId = parseInt(req.params.vehicleId || req.params.id);
  const userId    = req.user.id;

  if (!vehicleId) return res.status(400).json({ error: 'vehicleId invalide' });

  try {
    const [rows] = await db.execute(
      `SELECT v.id, v.owner_id,
              vs.permission
       FROM vehicles v
       LEFT JOIN vehicle_shares vs ON vs.vehicle_id = v.id AND vs.shared_with_id = ?
       WHERE v.id = ? AND v.is_active = 1`,
      [userId, vehicleId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Véhicule introuvable' });

    const vehicle  = rows[0];
    const isOwner  = vehicle.owner_id === userId;
    const canView  = isOwner || !!vehicle.permission;
    const canEdit  = isOwner || vehicle.permission === 'edit';

    if (!canView) return res.status(403).json({ error: 'Accès refusé' });
    if (allowEdit && !canEdit) return res.status(403).json({ error: 'Permission insuffisante' });

    req.vehicleAccess = { vehicleId, isOwner, canEdit };
    next();
  } catch (err) {
    console.error('[Auth] vehicleAccess error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { authenticate, vehicleAccess };
