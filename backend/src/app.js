require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

const authRoutes        = require('./routes/auth');
const vehicleRoutes     = require('./routes/vehicles');
const tripRoutes        = require('./routes/trips');
const expenseRoutes     = require('./routes/expenses');
const maintenanceRoutes = require('./routes/maintenance');
const statsRoutes       = require('./routes/stats');

const app = express();

// ── Sécurité ─────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  message:  { error: 'Trop de requêtes, réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders:   false,
}));

// Rate limiting renforcé pour l'auth
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: 'Trop de tentatives de connexion.' },
}));

app.use('/api/auth/register', rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      5,
  message:  { error: 'Trop d\'inscriptions depuis cette IP.' },
}));

// ── Parsers ───────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Routes API ────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicles/:vehicleId/trips',       tripRoutes);
app.use('/api/vehicles/:vehicleId/expenses',    expenseRoutes);
app.use('/api/vehicles/:vehicleId/maintenance', maintenanceRoutes);

// ── Serve frontend (production) ───────────────────────────────
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Route introuvable' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ── Démarrage ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`[Carlog] ✅ Serveur démarré sur le port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;
