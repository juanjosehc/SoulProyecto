const express = require('express');
const router = express.Router();
const { obtenerPedidos, crearPedido, editarPedido, cambiarEstadoPedido } = require('../controllers/pedidoController');

router.get('/', obtenerPedidos);
router.post('/', crearPedido);
router.put('/:id', editarPedido);
router.patch('/:id/estado', cambiarEstadoPedido);

module.exports = router;
