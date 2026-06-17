const express = require('express');
const router = express.Router();
const { obtenerVentas, crearVenta, anularVenta, obtenerVentaPorId } = require('../controllers/ventaController');

router.get('/', obtenerVentas);
router.get('/:id', obtenerVentaPorId);
router.post('/', crearVenta);
router.patch('/:id/anular', anularVenta);

module.exports = router;
