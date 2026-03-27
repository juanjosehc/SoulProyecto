import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Shield, Users, Package, PackageSearch, 
  Store, ShoppingCart, User, Box, TrendingUp, Calendar, LogOut 
} from 'lucide-react'; 
import './AdminLayout.css'; 

// Mapeo de módulos del sidebar con su permiso correspondiente
const sidebarItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permiso: 'dashboard' },
  { path: '/admin/roles', label: 'Roles y Permisos', icon: Shield, permiso: 'roles' },
  { path: '/admin/usuarios', label: 'Usuarios', icon: Users, permiso: 'usuarios' },
  { path: '/admin/categorias', label: 'Categorías', icon: Package, permiso: 'categorias' },
  { path: '/admin/productos', label: 'Productos', icon: PackageSearch, permiso: 'productos' },
  { path: '/admin/proveedores', label: 'Proveedores', icon: Store, permiso: 'proveedores' },
  { path: '/admin/compras', label: 'Compras', icon: ShoppingCart, permiso: 'compras' },
  { path: '/admin/clientes', label: 'Clientes', icon: User, permiso: 'clientes' },
  { path: '/admin/pedidos', label: 'Pedidos', icon: Box, permiso: 'pedidos' },
  { path: '/admin/ventas', label: 'Ventas', icon: TrendingUp, permiso: 'ventas' },
  { path: '/admin/entregas', label: 'Entregas', icon: Calendar, permiso: 'entregas' },
];

export const AdminLayout = () => {
  const navigate = useNavigate();

  // Verificar autenticación
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    return <Navigate to="/login" replace />;
  }

  // Clientes no deben acceder al admin
  if (user.tipo === 'cliente') {
    return <Navigate to="/catalogo" replace />;
  }

  // Obtener permisos del usuario (asegurar que sea un array válido)
  let permisos = [];
  if (Array.isArray(user.permisos) && user.permisos.length > 0) {
    permisos = user.permisos;
  }

  // Filtrar sidebar según permisos del usuario
  // Si el array de permisos está vacío (rol sin permisos configurados), mostrar TODOS
  // Esto previene que un admin con rol existente antes de la migración se quede sin acceso
  const itemsVisibles = permisos.length > 0
    ? sidebarItems.filter(item => permisos.includes(item.permiso))
    : sidebarItems; // Mostrar todo si no hay permisos configurados (backwards compatibility)

  const navClass = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login'); 
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>SOUL</h2>
          <p>{user.rol || 'Administrador'}</p>
        </div>

        <nav className="sidebar-nav">
          {itemsVisibles.map(item => (
            <NavLink key={item.path} to={item.path} className={navClass} end={item.path === '/admin/dashboard'}>
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.nombre || 'Usuario'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet /> 
      </main>
    </div>
  );
};