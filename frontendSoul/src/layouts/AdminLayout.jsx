import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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

  // Obtener permisos del usuario y normalizar a minúsculas para comparación
  let permisosNormalizados = [];
  if (Array.isArray(user.permisos) && user.permisos.length > 0) {
    permisosNormalizados = user.permisos.map(p => p.toLowerCase());
  }

  // Filtrar sidebar según permisos del usuario (comparación case-insensitive)
  const itemsVisibles = permisosNormalizados.length > 0
    ? sidebarItems.filter(item => permisosNormalizados.includes(item.permiso.toLowerCase()))
    : sidebarItems;

  // Protección de ruta: verificar que la ruta actual está permitida
  const currentPath = location.pathname;
  if (permisosNormalizados.length > 0 && currentPath !== '/admin') {
    const currentItem = sidebarItems.find(item => currentPath.startsWith(item.path));
    if (currentItem && !permisosNormalizados.includes(currentItem.permiso.toLowerCase())) {
      // Redirigir al primer módulo permitido
      const primerPermitido = itemsVisibles[0]?.path || '/login';
      return <Navigate to={primerPermitido} replace />;
    }
  }

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