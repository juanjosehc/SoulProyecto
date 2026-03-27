import { useState, useEffect } from 'react';
import { Users, Plus, Eye, Edit, Power, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserModal } from './components/UserModal';
import './Usuarios.css';

export const Usuarios = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // ==========================================
  // CONEXIÓN CON EL BACKEND
  // ==========================================

  const cargarUsuarios = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/usuarios');
      const datos = await respuesta.json();
      
      if (Array.isArray(datos)) {
        setUsers(datos);
      } else {
        console.error("Error desde el backend:", datos);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleSaveUser = async (userDataFromModal) => {
    try {
      const url = modalMode === 'create' 
        ? 'http://localhost:3000/api/usuarios' 
        : `http://localhost:3000/api/usuarios/${userDataFromModal.id}`;
        
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const respuesta = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userDataFromModal)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        alert(errorData.error || "Ocurrió un error al guardar");
        return; // Detenemos la ejecución si hubo error (ej: correo duplicado)
      }
      
      cargarUsuarios();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
    }
  };

  const toggleUserStatus = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    try {
      await fetch(`http://localhost:3000/api/usuarios/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.isActive })
      });
      cargarUsuarios();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/usuarios/${userToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.error || "No se pudo eliminar el usuario");
      } else {
        cargarUsuarios();
      }
      handleCloseDelete();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // ==========================================
  // MANEJO DE MODALES Y UI
  // ==========================================
  const handleOpenCreate = () => { setModalMode('create'); setSelectedUser(null); setIsModalOpen(true); };
  const handleOpenEdit = (user) => { setModalMode('edit'); setSelectedUser(user); setIsModalOpen(true); };
  const handleOpenView = (user) => { setModalMode('view'); setSelectedUser(user); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedUser(null); };
  const handleOpenDelete = (user) => { setUserToDelete(user); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setUserToDelete(null); };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchName = user.name?.toLowerCase().includes(term) || false;
    const matchEmail = user.email?.toLowerCase().includes(term) || false;
    const matchRole = user.role?.toLowerCase().includes(term) || false;
    const matchStatus = (user.isActive ? 'activo' : 'inactivo').includes(term);
    return matchName || matchEmail || matchRole || matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="users-module">
      <header className="users-header">
        <div className="title-section">
          <Users size={28} className="title-icon" />
          <div>
            <h1>Usuarios</h1>
            <p>Gestión de usuarios del sistema</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar por nombre, correo, rol..." value={searchTerm} onChange={handleSearch} className="search-input" />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Nuevo Usuario
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo Electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className="role-pill">{user.role}</span></td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(user)}><Eye size={18} /></button>
                      <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(user)}><Edit size={18} /></button>
                      <button className={`btn-action ${!user.isActive ? 'power-off' : ''}`} onClick={() => toggleUserStatus(user.id)}><Power size={18} /></button>
                      <button className="btn-action btn-delete" onClick={() => handleOpenDelete(user)}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>No se encontraron usuarios.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button className="btn-page" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={18} /></button>
          <span className="page-indicator">Página {currentPage} de {totalPages}</span>
          <button className="btn-page" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={18} /></button>
        </div>
      )}

      <UserModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} userData={selectedUser} onSave={handleSaveUser} />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={handleCloseDelete}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>¿Estás seguro de eliminar a <strong>"{userToDelete?.name}"</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDelete}>Cancelar</button>
              <button className="btn-danger" onClick={handleConfirmDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};