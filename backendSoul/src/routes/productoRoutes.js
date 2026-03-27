const express = require('express');
const router = express.Router();
const { 
  obtenerProductos, obtenerProductosActivos, buscarProductos,
  crearProducto, editarProducto, cambiarEstadoProducto, eliminarProducto, subirImagen 
} = require('../controllers/productoController');

router.get('/', obtenerProductos);
router.get('/active', obtenerProductosActivos);
router.get('/search', buscarProductos);
router.post('/', crearProducto);
router.post('/upload', subirImagen);
router.put('/:id', editarProducto);
router.patch('/:id/estado', cambiarEstadoProducto);
router.delete('/:id', eliminarProducto);

module.exports = router;