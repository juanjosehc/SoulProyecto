const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

router.get('/', proveedorController.obtenerProveedores);
router.get('/search', proveedorController.buscarProveedores);
router.post('/', proveedorController.crearProveedor);
router.put('/:id', proveedorController.editarProveedor);
router.patch('/:id/estado', proveedorController.cambiarEstadoProveedor);
router.delete('/:id', proveedorController.eliminarProveedor);

module.exports = router;