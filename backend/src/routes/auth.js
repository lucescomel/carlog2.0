const express = require('express');
const { body }  = require('express-validator');
const router    = express.Router();
const ctrl      = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe : 8 caractères minimum'),
  body('first_name').trim().notEmpty().withMessage('Prénom requis'),
  body('last_name').trim().notEmpty().withMessage('Nom requis'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', registerRules, ctrl.register);
router.post('/login',    loginRules,    ctrl.login);
router.post('/refresh',                 ctrl.refresh);
router.post('/logout',                  ctrl.logout);
router.get('/me',  authenticate,        ctrl.me);
router.patch('/profile', authenticate, [
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
], ctrl.updateProfile);
router.patch('/password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
], ctrl.changePassword);

module.exports = router;
