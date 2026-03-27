const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const rolRoutes = require('./src/routes/rolRoutes');
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

// Usar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de backend corriendo en http://localhost:${PORT}`);
});