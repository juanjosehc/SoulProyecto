const express = require('express');
const router = express.Router();
const { obtenerEntregas, cambiarEstadoEntrega } = require('../controllers/entregaController');

router.get('/', obtenerEntregas);
router.patch('/:id/estado', cambiarEstadoEntrega);

module.exports = router;
