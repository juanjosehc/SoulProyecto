const express = require('express');
const router = express.Router();
const { obtenerVentas, crearVenta, anularVenta } = require('../controllers/ventaController');

router.get('/', obtenerVentas);
router.post('/', crearVenta);
router.patch('/:id/anular', anularVenta);

module.exports = router;
