import { useState, useEffect } from 'react';
import { Truck, Plus, Eye, Edit, Power, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SupplierModal } from './components/SupplierModal';
import './Proveedores.css';

export const Proveedores = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // ==========================================
  // CONEXIÓN CON EL BACKEND
  // ==========================================
  const cargarProveedores = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/proveedores');
      const datos = await respuesta.json();
      if (Array.isArray(datos)) {
        setSuppliers(datos);
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const handleSaveSupplier = async (supplierDataFromModal) => {
    try {
      const url = modalMode === 'create' 
        ? 'http://localhost:3000/api/proveedores' 
        : `http://localhost:3000/api/proveedores/${supplierDataFromModal.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const respuesta = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierDataFromModal)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        alert(errorData.error || "Ocurrió un error");
        return;
      }
      
      cargarProveedores();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
    }
  };

  const toggleSupplierStatus = async (id) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;

    try {
      await fetch(`http://localhost:3000/api/proveedores/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !supplier.isActive })
      });
      cargarProveedores();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/proveedores/${supplierToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.error || "No se pudo eliminar el proveedor");
      } else {
        cargarProveedores();
      }
      handleCloseDelete();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // ==========================================
  // MANEJO DE MODALES UI Y FILTROS
  // ==========================================
  const handleOpenCreate = () => { setModalMode('create'); setSelectedSupplier(null); setIsModalOpen(true); };
  const handleOpenEdit = (supplier) => { setModalMode('edit'); setSelectedSupplier(supplier); setIsModalOpen(true); };
  const handleOpenView = (supplier) => { setModalMode('view'); setSelectedSupplier(supplier); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedSupplier(null); };
  const handleOpenDelete = (supplier) => { setSupplierToDelete(supplier); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setSupplierToDelete(null); };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const term = searchTerm.toLowerCase();
    const matchName = supplier.name?.toLowerCase().includes(term) || false;
    const matchContact = supplier.contact?.toLowerCase().includes(term) || false;
    const matchEmail = supplier.email?.toLowerCase().includes(term) || false;
    const matchStatus = (supplier.isActive ? 'activo' : 'inactivo').includes(term);
    return matchName || matchContact || matchEmail || matchStatus;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="suppliers-module">
      <header className="suppliers-header">
        <div className="title-section">
          <Truck size={28} className="title-icon" />
          <div>
            <h1>Proveedores</h1>
            <p>Gestión de proveedores y socios comerciales</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar por empresa, contacto o correo..." value={searchTerm} onChange={handleSearch} className="search-input" />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Nuevo Proveedor
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentSuppliers.length > 0 ? (
              currentSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td style={{ fontWeight: '500', color: '#e4e4e7' }}>{supplier.name}</td>
                  <td>{supplier.contact}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email}</td>
                  <td>
                    <span className={`status-badge ${supplier.isActive ? 'active' : 'inactive'}`}>
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(supplier)}><Eye size={18} /></button>
                      <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(supplier)}><Edit size={18} /></button>
                      <button className={`btn-action ${!supplier.isActive ? 'power-off' : ''}`} onClick={() => toggleSupplierStatus(supplier.id)}><Power size={18} /></button>
                      <button className="btn-action btn-delete" onClick={() => handleOpenDelete(supplier)}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>No se encontraron proveedores.</td></tr>
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

      <SupplierModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} supplierData={selectedSupplier} onSave={handleSaveSupplier} />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={handleCloseDelete} title="Cerrar"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>¿Estás seguro de que deseas eliminar al proveedor <strong>"{supplierToDelete?.name}"</strong>?</p>
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