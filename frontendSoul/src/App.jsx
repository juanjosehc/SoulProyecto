import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importación de Auth y Vistas de Cliente
import { Login } from './pages/auth/Login'; 
import { ResetPassword } from './pages/auth/ResetPassword';
import { Catalogo } from './pages/client/Catalogo/Catalogo';

// Importación de Layout y Vistas de Admin
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard/Dashboard';
import { RolesPermisos } from './pages/admin/RolesPermisos/RolesPermisos';
import { Usuarios } from './pages/admin/Usuarios/Usuarios';
import { Categorias } from './pages/admin/Categorias/Categorias';
import { Productos } from './pages/admin/Productos/Productos';
import { Proveedores } from './pages/admin/Proveedores/Proveedores';
import { Compras } from './pages/admin/Compras/Compras';
import { Clientes } from './pages/admin/Clientes/Clientes';
import { Pedidos } from './pages/admin/Pedidos/Pedidos';
import { Ventas } from './pages/admin/Ventas/Ventas';
import { Entregas } from './pages/admin/Entregas/Entregas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA POR DEFECTO */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/catalogo" element={<Catalogo />} />

        {/* RUTAS PRIVADAS (Panel de Administración) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="roles" element={<RolesPermisos />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="productos" element={<Productos />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="compras" element={<Compras />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="entregas" element={<Entregas />} />
        </Route>

        {/* RUTA COMODÍN */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;