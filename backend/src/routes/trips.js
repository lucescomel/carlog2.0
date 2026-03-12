const express = require('express');
const { body } = require('express-validator');
const router   = express.Router({ mergeParams: true });
const ctrl     = require('../controllers/tripController');
const { authenticate, vehicleAccess } = require('../middleware/auth');

const tripRules = [
  body('date').isDate().withMessage('Date invalide'),
  body('distance').isFloat({ min: 0.1 }).withMessage('Distance invalide'),
  body('trip_type').isIn(['personnel','professionnel']).withMessage('Type de trajet invalide'),
];

router.use(authenticate);

// vehicleAccess(false) = view only | vehicleAccess(true) = edit required
router.get('/',       vehicleAccess(false), ctrl.list);
router.post('/',      vehicleAccess(true),  tripRules, ctrl.create);
router.put('/:id',    vehicleAccess(true),  tripRules, ctrl.update);
router.delete('/:id', vehicleAccess(true),  ctrl.remove);

module.exports = router;
