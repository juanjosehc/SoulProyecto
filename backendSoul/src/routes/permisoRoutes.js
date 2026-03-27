const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');

router.get('/', rolController.obtenerPermisosCatalogo);

module.exports = router;
