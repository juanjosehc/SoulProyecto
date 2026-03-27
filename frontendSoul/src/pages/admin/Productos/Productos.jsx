import { useState, useEffect } from 'react';
import { Package, Plus, Eye, Edit, Power, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductModal } from './components/ProductModal';
import './Productos.css';

export const Productos = () => {
  // Iniciamos el estado vacío, esperando los datos del backend
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // ==========================================
  // CONEXIÓN CON EL BACKEND (CRUD)
  // ==========================================

  // 1. LEER (GET) - Traer productos con tallas e imágenes
  const cargarProductos = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/productos');
      const datos = await respuesta.json();
      
      // El "Escudo": verificamos que sea un arreglo para que no de pantalla gris
      if (Array.isArray(datos)) {
        setProducts(datos);
      } else {
        console.error("El backend respondió con un error:", datos);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error al conectar con el backend:", error);
      setProducts([]);
    }
  };

  // Ejecutar al cargar la página
  useEffect(() => {
    cargarProductos();
  }, []);

  // 2. CREAR Y EDITAR (POST / PUT)
  const handleSaveProduct = async (productDataFromModal) => {
    try {
      // El modal ya nos entrega los datos en el formato perfecto para nuestra API
      const url = modalMode === 'create' 
        ? 'http://localhost:3000/api/productos' 
        : `http://localhost:3000/api/productos/${productDataFromModal.id}`;
        
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productDataFromModal)
      });
      
      cargarProductos();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
    }
  };

  // 3. CAMBIAR ESTADO (PATCH)
  const toggleProductStatus = async (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      await fetch(`http://localhost:3000/api/productos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !product.isActive })
      });
      
      cargarProductos();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // 4. ELIMINAR (DELETE)
  const handleConfirmDelete = async () => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/productos/${productToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!respuesta.ok) {
        const error = await respuesta.json();
        alert(error.error || "No se pudo eliminar el producto");
      } else {
        cargarProductos();
      }
      handleCloseDelete();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // ==========================================
  // MANEJO DE MODALES
  // ==========================================
  const handleOpenCreate = () => { setModalMode('create'); setSelectedProduct(null); setIsModalOpen(true); };
  const handleOpenEdit = (product) => { setModalMode('edit'); setSelectedProduct(product); setIsModalOpen(true); };
  const handleOpenView = (product) => { setModalMode('view'); setSelectedProduct(product); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedProduct(null); };
  const handleOpenDelete = (product) => { setProductToDelete(product); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setProductToDelete(null); };

  // ==========================================
  // BÚSQUEDA Y PAGINACIÓN
  // ==========================================
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const matchName = product.name?.toLowerCase().includes(term) || false;
    const matchCategory = product.category?.toLowerCase().includes(term) || false;
    const matchStatus = (product.isActive ? 'activo' : 'inactivo').includes(term);
    
    return matchName || matchCategory || matchStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  // RENDERIZADO
  return (
    <div className="products-module">
      <header className="products-header">
        <div className="title-section">
          <Package size={28} className="title-icon" />
          <div>
            <h1>Productos</h1>
            <p>Gestión del catálogo de productos y existencias</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar producto, categoría..." 
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre del Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={
                        product.images && product.images.length > 0 
                          ? (typeof product.images[0] === 'string' ? product.images[0] : product.images.find(i => i.esPrincipal)?.url || product.images[0]?.url || product.images[0])
                          : 'https://via.placeholder.com/60'
                      } 
                      alt={product.name} 
                      className="product-thumbnail" 
                    />
                  </td>
                  <td style={{ fontWeight: '500', color: '#e4e4e7' }}>{product.name}</td>
                  <td><span className="category-pill">{product.category}</span></td>
                  <td style={{ color: '#C9A24D' }}>{formatCurrency(product.price)}</td>
                  <td>
                    <span className={`stock-indicator ${product.stock <= 5 ? 'low-stock' : ''}`}>
                      {product.stock} unds
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(product)}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(product)}>
                        <Edit size={18} />
                      </button>
                      <button 
                        className={`btn-action ${!product.isActive ? 'power-off' : ''}`} 
                        title={product.isActive ? "Desactivar" : "Activar"}
                        onClick={() => toggleProductStatus(product.id)}
                      >
                        <Power size={18} />
                      </button>
                      <button 
                        className="btn-action btn-delete" 
                        title="Eliminar" 
                        onClick={() => handleOpenDelete(product)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>
                  No se encontraron productos que coincidan con la búsqueda.
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

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        mode={modalMode} 
        productData={selectedProduct} 
        onSave={handleSaveProduct}
      />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="btn-close" onClick={handleCloseDelete} title="Cerrar">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>
                ¿Estás seguro de que deseas eliminar el producto <strong>"{productToDelete?.name}"</strong>? <br/><br/>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>Esta acción no se puede deshacer.</span>
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