const express = require('express');
const router = express.Router();
const { obtenerPedidos, crearPedido, editarPedido, cambiarEstadoPedido } = require('../controllers/pedidoController');
const { verificarPermiso } = require('../middleware/authMiddleware');

router.get('/', verificarPermiso('MODULO_PEDIDOS'), obtenerPedidos);
router.post('/', crearPedido);
router.put('/:id', verificarPermiso('MODULO_PEDIDOS'), editarPedido);
router.patch('/:id/estado', verificarPermiso('MODULO_PEDIDOS'), cambiarEstadoPedido);

module.exports = router;
