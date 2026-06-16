const express = require('express');
const router = express.Router();
const { obtenerCarrito, guardarCarrito } = require('../controllers/carritoController');

router.get('/', obtenerCarrito);
router.post('/', guardarCarrito);

module.exports = router;
