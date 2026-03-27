import { useState, useEffect } from 'react';
import { Layers, Plus, Eye, Edit, Power, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryModal } from './components/CategoryModal';
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

  // ==========================================
  // CONEXIÓN CON EL BACKEND (PETICIONES HTTP)
  // ==========================================

  // 1. LEER (GET) - Cargar datos desde la base de datos
  const cargarCategorias = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/categorias');
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
    try {
      // Preparamos los datos con los nombres que espera PostgreSQL
      const datosParaBackend = {
        nombre: categoryDataFromModal.name,
        descripcion: categoryDataFromModal.description
      };

      if (modalMode === 'create') {
        await fetch('http://localhost:3000/api/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaBackend)
        });
      } else if (modalMode === 'edit') {
        await fetch(`http://localhost:3000/api/categorias/${categoryDataFromModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaBackend)
        });
      }
      
      // Recargamos la tabla y cerramos el modal
      cargarCategorias();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar la categoría:", error);
    }
  };

  // 3. CAMBIAR ESTADO (PATCH)
  const toggleCategoryStatus = async (id) => {
    // Buscamos la categoría actual para saber su estado e invertirlo
    const categoria = categories.find(c => c.id === id);
    if (!categoria) return;

    try {
      await fetch(`http://localhost:3000/api/categorias/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !categoria.isActive }) // Enviamos el estado invertido
      });
      
      cargarCategorias(); // Recargamos la tabla para ver el cambio
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // 4. ELIMINAR (DELETE)
  const handleConfirmDelete = async () => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/categorias/${categoryToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.error || "Error al eliminar"); // Si tiene productos, mostrará el error de llave foránea
      } else {
        cargarCategorias();
      }
      handleCloseDelete();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // ==========================================
  // MANEJO DE MODALES (Apertura y Cierre)
  // ==========================================
  const handleOpenCreate = () => { setModalMode('create'); setSelectedCategory(null); setIsModalOpen(true); };
  const handleOpenEdit = (category) => { setModalMode('edit'); setSelectedCategory(category); setIsModalOpen(true); };
  const handleOpenView = (category) => { setModalMode('view'); setSelectedCategory(category); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedCategory(null); };
  const handleOpenDelete = (category) => { setCategoryToDelete(category); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setCategoryToDelete(null); };

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
      />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={handleCloseDelete} title="Cerrar"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>
                ¿Estás seguro de que deseas eliminar la categoría <strong>"{categoryToDelete?.name}"</strong>? <br/><br/>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>Los productos asociados a esta categoría podrían verse afectados.</span>
              </p>
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