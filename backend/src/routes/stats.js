const express = require('express');
const router  = express.Router({ mergeParams: true });
const ctrl    = require('../controllers/statsController');
const { authenticate, vehicleAccess } = require('../middleware/auth');

router.use(authenticate);

// Dashboard global (tous véhicules de l'user)
router.get('/dashboard', ctrl.dashboard);

// Stats d'un véhicule spécifique
router.get('/vehicles/:vehicleId/stats', vehicleAccess(false), ctrl.vehicleStats);

module.exports = router;
