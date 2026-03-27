const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar middleware de autenticación
const { verificarToken, verificarPermiso } = require('./src/middleware/authMiddleware');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const rolRoutes = require('./src/routes/rolRoutes');
const permisoRoutes = require('./src/routes/permisoRoutes');
const proveedorRoutes = require('./src/routes/proveedorRoutes');
const compraRoutes = require('./src/routes/compraRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');
const ventaRoutes = require('./src/routes/ventaRoutes');
const entregaRoutes = require('./src/routes/entregaRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();

// Middlewares (Configuraciones base)
app.use(cors()); // Permite que tu frontend de React haga peticiones aquí
app.use(express.json({ limit: '50mb' })); // Permite recibir datos en formato JSON (aumentado para imágenes)

// === RUTAS PÚBLICAS (sin autenticación) ===
app.use('/api/auth', authRoutes);

// Productos: rutas públicas (/active y /search) se manejan ANTES del middleware
// Las rutas que necesitan permisos se protegen dentro del archivo de rutas
app.use('/api/productos', productoRoutes);

// Categorías: públicas para que el catálogo pueda cargar los filtros
app.use('/api/categorias', categoriaRoutes);

// === RUTAS PROTEGIDAS (requieren autenticación + permisos) ===
app.use('/api/permisos', verificarToken, verificarPermiso('MODULO_ROLES'), permisoRoutes); // Mismo permiso que roles
app.use('/api/usuarios', verificarToken, usuarioRoutes); // Internamente validará, o se puede restringir si es necesario
app.use('/api/roles', verificarToken, verificarPermiso('MODULO_ROLES'), rolRoutes);
app.use('/api/proveedores', verificarToken, verificarPermiso('MODULO_PROVEEDORES'), proveedorRoutes);
app.use('/api/compras', verificarToken, verificarPermiso('MODULO_COMPRAS'), compraRoutes);
app.use('/api/clientes', verificarToken, clienteRoutes);
app.use('/api/pedidos', verificarToken, verificarPermiso('MODULO_PEDIDOS'), pedidoRoutes);
app.use('/api/ventas', verificarToken, verificarPermiso('MODULO_VENTAS'), ventaRoutes);
app.use('/api/entregas', verificarToken, verificarPermiso('MODULO_ENTREGAS'), entregaRoutes);
app.use('/api/dashboard', verificarToken, verificarPermiso('MODULO_DASHBOARD'), dashboardRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de backend corriendo en http://localhost:${PORT}`);
});