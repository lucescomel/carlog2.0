const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db       = require('../config/database');

const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    domain:   process.env.COOKIE_DOMAIN || undefined,
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password, first_name, last_name } = req.body;

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email.toLowerCase(), hash, first_name.trim(), last_name.trim()]
    );

    const userId = result.insertId;
    const { accessToken, refreshToken } = generateTokens(userId, email.toLowerCase());

    // Sauvegarder le refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, refreshToken, expiresAt]
    );

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: { id: userId, email: email.toLowerCase(), first_name, last_name },
    });
  } catch (err) {
    console.error('[Auth] register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const [rows] = await db.execute(
      'SELECT id, email, password, first_name, last_name FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (!rows.length) return res.status(401).json({ error: 'Identifiants invalides' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Identifiants invalides' });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        id:         user.id,
        email:      user.email,
        first_name: user.first_name,
        last_name:  user.last_name,
      },
    });
  } catch (err) {
    console.error('[Auth] login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token manquant' });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const [rows] = await db.execute(
      'SELECT id, user_id FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (!rows.length) return res.status(401).json({ error: 'Session expirée, reconnectez-vous' });

    const [users] = await db.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      [payload.userId]
    );
    if (!users.length) return res.status(401).json({ error: 'Utilisateur introuvable' });

    const user = users[0];

    // Rotation du refresh token
    await db.execute('DELETE FROM refresh_tokens WHERE id = ?', [rows[0].id]);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, newRefreshToken, expiresAt]
    );

    setRefreshCookie(res, newRefreshToken);
    res.json({
      accessToken,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
    });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token invalide' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      await db.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    } catch (_) {}
  }
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.json({ message: 'Déconnexion réussie' });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /api/auth/profile
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { first_name, last_name } = req.body;
  try {
    await db.execute(
      'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
      [first_name.trim(), last_name.trim(), req.user.id]
    );
    const [rows] = await db.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /api/auth/password
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { current_password, new_password } = req.body;
  try {
    const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    // Invalider tous les refresh tokens
    await db.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
    res.clearCookie('refreshToken');
    res.json({ message: 'Mot de passe modifié. Reconnectez-vous.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
