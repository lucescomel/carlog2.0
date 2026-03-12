const express = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const ctrl     = require('../controllers/vehicleController');
const { authenticate, vehicleAccess } = require('../middleware/auth');

const vehicleRules = [
  body('brand').trim().notEmpty().withMessage('Marque requise'),
  body('model').trim().notEmpty().withMessage('Modèle requis'),
  body('registration').trim().notEmpty().withMessage('Immatriculation requise'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
  body('mileage').isInt({ min: 0 }).withMessage('Kilométrage invalide'),
  body('fuel_type').isIn(['essence','diesel','electrique','hybride','hybride_rechargeable','gpl'])
    .withMessage('Type de carburant invalide'),
];

router.use(authenticate);

router.get('/',    ctrl.list);
router.post('/',   vehicleRules, ctrl.create);
router.get('/:id', vehicleAccess(false), ctrl.get);
router.put('/:id', vehicleAccess(true), vehicleRules, ctrl.update);
router.delete('/:id', vehicleAccess(false), ctrl.remove);

// Partage
router.get('/:id/shares',           vehicleAccess(false), ctrl.getShares);
router.post('/:id/shares',          vehicleAccess(false), ctrl.addShare);
router.delete('/:id/shares/:shareId', vehicleAccess(false), ctrl.removeShare);

module.exports = router;
