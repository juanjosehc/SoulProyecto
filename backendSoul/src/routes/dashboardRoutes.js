const express = require('express');
const router = express.Router();
const { obtenerStats, obtenerVentasPorDia, obtenerTopProductos, obtenerStockBajo } = require('../controllers/dashboardController');

router.get('/stats', obtenerStats);
router.get('/sales-chart', obtenerVentasPorDia);
router.get('/top-products', obtenerTopProductos);
router.get('/low-stock', obtenerStockBajo);

module.exports = router;
