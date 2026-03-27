const express = require('express');
const router = express.Router();
const { obtenerClientes, crearCliente, actualizarCliente, cambiarEstadoCliente, eliminarCliente, buscarClientes } = require('../controllers/clienteController');

router.get('/', obtenerClientes);
router.get('/search', buscarClientes);
router.post('/', crearCliente);
router.put('/:id', actualizarCliente);
router.patch('/:id/estado', cambiarEstadoCliente);
router.delete('/:id', eliminarCliente);

module.exports = router;