import { useState, useEffect } from 'react';
import { Shield, Plus, Eye, Edit, Power, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { RoleModal } from './components/RoleModal';
import './RolesPermisos.css';

export const RolesPermisos = () => {
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // ==========================================
  // CONEXIÓN CON EL BACKEND
  // ==========================================
  const cargarRoles = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/roles');
      const datos = await respuesta.json();
      if (Array.isArray(datos)) {
        setRoles(datos);
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const handleSaveRole = async (roleDataFromModal) => {
    try {
      const url = modalMode === 'create' 
        ? 'http://localhost:3000/api/roles' 
        : `http://localhost:3000/api/roles/${roleDataFromModal.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const respuesta = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleDataFromModal)
      });

      if (!respuesta.ok) {
        // Leemos como texto puro primero para evitar que React colapse si el backend manda algo vacío
        const textResponse = await respuesta.text(); 
        let errorMessage = "Ocurrió un error en el servidor";
        try {
          const parsed = JSON.parse(textResponse);
          errorMessage = parsed.error || errorMessage;
        } catch(e) { }
        
        alert(errorMessage);
        return;
      }
      
      cargarRoles();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar rol:", error);
    }
  };

  const toggleRoleStatus = async (id) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;

    try {
      await fetch(`http://localhost:3000/api/roles/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !role.isActive })
      });
      cargarRoles();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/roles/${roleToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.error || "No se pudo eliminar el rol");
      } else {
        cargarRoles();
      }
      handleCloseDelete();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // ==========================================
  // MANEJO DE MODALES UI
  // ==========================================
  const handleOpenCreate = () => { setModalMode('create'); setSelectedRole(null); setIsModalOpen(true); };
  const handleOpenEdit = (role) => { setModalMode('edit'); setSelectedRole(role); setIsModalOpen(true); };
  const handleOpenView = (role) => { setModalMode('view'); setSelectedRole(role); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedRole(null); };
  const handleOpenDelete = (role) => { setRoleToDelete(role); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setRoleToDelete(null); };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  const filteredRoles = roles.filter(role => {
    const term = searchTerm.toLowerCase();
    const matchName = role.name?.toLowerCase().includes(term) || false;
    const matchStatus = (role.isActive ? 'activo' : 'inactivo').includes(term);
    const matchModules = role.permisos?.some(permiso => permiso.toLowerCase().includes(term)) || false;
    return matchName || matchStatus || matchModules;
  });

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="roles-module">
      <header className="roles-header">
        <div className="title-section">
          <Shield size={28} className="title-icon" />
          <div>
            <h1>Roles y Permisos</h1>
            <p>Gestión de roles y permisos del sistema</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar por rol, módulo o estado..." value={searchTerm} onChange={handleSearch} className="search-input" />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Nuevo Rol
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="roles-table">
          <thead>
            <tr>
              <th>Nombre del Rol</th>
              <th style={{ width: '40%' }}>Módulos Permitidos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentRoles.length > 0 ? (
              currentRoles.map((role) => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>
                    <div className="modules-badges-container">
                      {role.permisos && role.permisos.length > 0 ? (
                        role.permisos.map((modulo, index) => (
                          <span key={index} className="module-pill">{modulo}</span>
                        ))
                      ) : (
                        <span className="no-modules">Sin módulos asignados</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${role.isActive ? 'active' : 'inactive'}`}>
                      {role.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(role)}><Eye size={18} /></button>
                      
                      {role.name !== 'Administrador' && (
                        <>
                          <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(role)}><Edit size={18} /></button>
                          <button className={`btn-action ${!role.isActive ? 'power-off' : ''}`} onClick={() => toggleRoleStatus(role.id)}><Power size={18} /></button>
                          <button className="btn-action btn-delete" onClick={() => handleOpenDelete(role)}><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>No se encontraron roles.</td></tr>
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

      <RoleModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} roleData={selectedRole} onSave={handleSaveRole} />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={handleCloseDelete} title="Cerrar"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>¿Estás seguro de que deseas eliminar el rol <strong>"{roleToDelete?.name}"</strong>?</p>
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