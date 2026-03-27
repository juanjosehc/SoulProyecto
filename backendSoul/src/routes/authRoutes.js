const express = require('express');
const router = express.Router();
const { login, registrarCliente, solicitarRecuperacion, restablecerPassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', registrarCliente);
router.post('/forgot-password', solicitarRecuperacion);
router.post('/reset-password', restablecerPassword);

module.exports = router;
