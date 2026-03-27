const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.get('/', usuarioController.obtenerUsuarios);
router.get('/search/domiciliarios', usuarioController.buscarDomiciliarios);
router.post('/', usuarioController.crearUsuario);
router.put('/:id', usuarioController.editarUsuario);
router.patch('/:id/estado', usuarioController.cambiarEstadoUsuario);
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;