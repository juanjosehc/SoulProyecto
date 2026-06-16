const express = require('express');
const router = express.Router();
const { obtenerEntregas, cambiarEstadoEntrega, obtenerHistorialEntrega } = require('../controllers/entregaController');

router.get('/mi-historial', obtenerHistorialEntrega);
router.get('/', obtenerEntregas);
router.patch('/:id/estado', cambiarEstadoEntrega);

module.exports = router;
