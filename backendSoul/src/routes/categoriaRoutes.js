const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// Definimos las URLs de nuestra API
router.get('/', categoriaController.obtenerCategorias);
router.post('/', categoriaController.crearCategoria);
router.put('/:id', categoriaController.editarCategoria);
router.patch('/:id/estado', categoriaController.cambiarEstadoCategoria);
router.delete('/:id', categoriaController.eliminarCategoria);

module.exports = router;