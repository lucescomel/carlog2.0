const express = require('express');
const { body } = require('express-validator');
const router   = express.Router({ mergeParams: true });
const ctrl     = require('../controllers/maintenanceController');
const { authenticate, vehicleAccess } = require('../middleware/auth');

const maintenanceRules = [
  body('date').isDate().withMessage('Date invalide'),
  body('type').isIn(['vidange','pneus','controle_technique','freins','distribution','batterie','filtres','autre'])
    .withMessage('Type invalide'),
  body('description').trim().notEmpty().withMessage('Description requise'),
];

router.use(authenticate);

router.get('/',       vehicleAccess(false), ctrl.list);
router.post('/',      vehicleAccess(true),  maintenanceRules, ctrl.create);
router.put('/:id',    vehicleAccess(true),  maintenanceRules, ctrl.update);
router.delete('/:id', vehicleAccess(true),  ctrl.remove);

module.exports = router;
