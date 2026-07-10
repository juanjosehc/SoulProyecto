import { useState, useEffect } from 'react';
import { Layers, Plus, Eye, Edit, Power, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryModal } from './components/CategoryModal';
import { API_URL } from '../../../config/api';
import './Categorias.css';

export const Categorias = () => {
  // Ya no usamos initialCategories, iniciamos vacío
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Estados para modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(''); // Error de llaves foráneas
  const [loading, setLoading] = useState(false); // Para feedback de carga visual

  // ==========================================
  // CONEXIÓN CON EL BACKEND (PETICIONES HTTP)
  // ==========================================

  // 1. LEER (GET) - Cargar datos desde la base de datos
  const cargarCategorias = async () => {
    try {
      const respuesta = await fetch('${API_URL}/categorias');
      const datos = await respuesta.json();
      
      if (Array.isArray(datos)) {
        // Traducimos los nombres de la BD al formato que usa tu frontend
        const categoriasAdaptadas = datos.map(categoria => ({
          id: categoria.id,
          name: categoria.nombre,
          description: categoria.descripcion || '',
          isActive: categoria.is_active
        }));
        setCategories(categoriasAdaptadas);
      }
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
    }
  };

  // Se ejecuta automáticamente al abrir la página
  useEffect(() => {
    cargarCategorias();
  }, []);

  // 2. CREAR Y EDITAR (POST / PUT)
  const handleSaveCategory = async (categoryDataFromModal) => {
    setLoading(true);
    try {
      const datosParaBackend = {
        nombre: categoryDataFromModal.name,
        descripcion: categoryDataFromModal.description
      };

      let respuesta;
      if (modalMode === 'create') {
        respuesta = await fetch('${API_URL}/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaBackend)
        });
      } else if (modalMode === 'edit') {
        respuesta = await fetch(`${API_URL}/categorias/${categoryDataFromModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaBackend)
        });
      }

      if (respuesta && !respuesta.ok) {
        const errData = await respuesta.json();
        alert(errData.error || 'Error al guardar la categoría');
      } else {
        cargarCategorias();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error al guardar la categoría:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. CAMBIAR ESTADO (PATCH)
  const toggleCategoryStatus = async (id) => {
    const categoria = categories.find(c => c.id === id);
    if (!categoria) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/categorias/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !categoria.isActive })
      });
      cargarCategorias();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    } finally {
      setLoading(false);
    }
  };

  // 4. ELIMINAR (DELETE)
  const handleConfirmDelete = async () => {
    setLoading(true);
    setDeleteError('');
    try {
      const respuesta = await fetch(`${API_URL}/categorias/${categoryToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json();
        // Captura del mensaje limpio enviado por el backend (error de llave foránea)
        setDeleteError(error.error || "No se puede eliminar esta categoría.");
      } else {
        cargarCategorias();
        handleCloseDelete();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      setDeleteError("Ocurrió un error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MANEJO DE MODALES (Apertura y Cierre)
  // ==========================================
  const handleOpenCreate = () => { setModalMode('create'); setSelectedCategory(null); setIsModalOpen(true); };
  const handleOpenEdit = (category) => { setModalMode('edit'); setSelectedCategory(category); setIsModalOpen(true); };
  const handleOpenView = (category) => { setModalMode('view'); setSelectedCategory(category); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedCategory(null); };
  const handleOpenDelete = (category) => { setCategoryToDelete(category); setDeleteError(''); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setCategoryToDelete(null); setDeleteError(''); };

  // ==========================================
  // LÓGICA DE BÚSQUEDA Y PAGINACIÓN
  // ==========================================
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredCategories = categories.filter(category => {
    const term = searchTerm.toLowerCase();
    const matchName = category.name.toLowerCase().includes(term);
    const matchDesc = category.description.toLowerCase().includes(term);
    const matchStatus = (category.isActive ? 'activo' : 'inactivo').includes(term);
    return matchName || matchDesc || matchStatus;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // RENDERIZADO (El JSX queda igual)
  return (
    <div className="categories-module">
      <header className="categories-header">
        <div className="title-section">
          <Layers size={28} className="title-icon" />
          <div>
            <h1>Categorías</h1>
            <p>Gestión de categorías de productos</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar categoría..." 
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            Nueva Categoría
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th style={{ width: '40%' }}>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentCategories.length > 0 ? (
              currentCategories.map((category) => (
                <tr key={category.id}>
                  <td style={{ fontWeight: '500', color: '#e4e4e7' }}>{category.name}</td>
                  <td>{category.description}</td>
                  <td>
                    <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                      {category.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(category)}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(category)}>
                        <Edit size={18} />
                      </button>
                      <button 
                        className={`btn-action ${!category.isActive ? 'power-off' : ''}`} 
                        title={category.isActive ? "Desactivar" : "Activar"}
                        onClick={() => toggleCategoryStatus(category.id)}
                      >
                        <Power size={18} />
                      </button>
                      <button 
                        className="btn-action btn-delete" 
                        title="Eliminar" 
                        onClick={() => handleOpenDelete(category)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>
                  No se encontraron categorías que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button className="btn-page" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">Página {currentPage} de {totalPages}</span>
          <button className="btn-page" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        mode={modalMode} 
        categoryData={selectedCategory} 
        onSave={handleSaveCategory}
        loading={loading}
      />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={handleCloseDelete} title="Cerrar" disabled={loading}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>
                ¿Estás seguro de que deseas eliminar la categoría <strong>"{categoryToDelete?.name}"</strong>? <br/><br/>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>Los productos asociados a esta categoría podrían verse afectados.</span>
              </p>
              {deleteError && (
                <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '14px' }}>
                  {deleteError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDelete} disabled={loading}>Cancelar</button>
              <button className="btn-danger" onClick={handleConfirmDelete} disabled={loading}>
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};