const express = require('express');
const { body } = require('express-validator');
const router   = express.Router({ mergeParams: true });
const ctrl     = require('../controllers/expenseController');
const { authenticate, vehicleAccess } = require('../middleware/auth');

const expenseRules = [
  body('date').isDate().withMessage('Date invalide'),
  body('category').isIn(['carburant','entretien','reparation','assurance','peage','parking','autre'])
    .withMessage('Catégorie invalide'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Montant invalide'),
];

router.use(authenticate);

router.get('/',       vehicleAccess(false), ctrl.list);
router.post('/',      vehicleAccess(true),  expenseRules, ctrl.create);
router.put('/:id',    vehicleAccess(true),  expenseRules, ctrl.update);
router.delete('/:id', vehicleAccess(true),  ctrl.remove);

module.exports = router;
