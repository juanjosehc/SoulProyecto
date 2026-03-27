import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Eye, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { PurchaseModal } from './components/PurchaseModal';
import './Compras.css';

export const Compras = () => {
  const [purchases, setPurchases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);

  const cargarCompras = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/compras');
      const datos = await respuesta.json();
      if (Array.isArray(datos)) {
        setPurchases(datos);
      }
    } catch (error) {
      console.error("Error al cargar compras:", error);
    }
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  const handleSavePurchase = async (purchaseDataFromModal) => {
    try {
      // 🚨 ADAPTACIÓN AL BACKEND: Mapeamos la data del modal a la estructura exacta de compraController.js
      const payload = {
        supplier: purchaseDataFromModal.provider, 
        date: purchaseDataFromModal.date,
        notes: `Pagado vía: ${purchaseDataFromModal.paymentMethod}`, 
        status: 'Completado', // Forzamos "Completado" para que aumente el stock en base de datos
        total: purchaseDataFromModal.total,
        details: purchaseDataFromModal.items.map(item => ({
          product: item.product,
          size: item.talla,
          quantity: item.cantidad,
          unitCost: item.valorUnitario
        }))
      };

      const respuesta = await fetch('http://localhost:3000/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        alert(errorData.error || "Ocurrió un error al registrar la compra");
        return;
      }
      
      cargarCompras();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar compra:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await fetch(`http://localhost:3000/api/compras/${purchaseToDelete.id}`, { method: 'DELETE' });
      cargarCompras();
      handleCloseDelete();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleOpenCreate = () => { setModalMode('create'); setSelectedPurchase(null); setIsModalOpen(true); };
  const handleOpenView = (purchase) => { setModalMode('view'); setSelectedPurchase(purchase); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedPurchase(null); };
  const handleOpenDelete = (purchase) => { setPurchaseToDelete(purchase); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setPurchaseToDelete(null); };

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const filteredPurchases = purchases.filter(purchase => {
    const term = searchTerm.toLowerCase();
    const matchSupplier = purchase.supplier?.toLowerCase().includes(term) || false;
    const matchStatus = purchase.status?.toLowerCase().includes(term) || false;
    return matchSupplier || matchStatus;
  });

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="purchases-module">
      <header className="purchases-header">
        <div className="title-section">
          <ShoppingCart size={28} className="title-icon" />
          <div>
            <h1>Compras e Inventario</h1>
            <p>Registro de compras a proveedores y entrada de mercancía</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar por proveedor..." value={searchTerm} onChange={handleSearch} className="search-input" />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Registrar Compra
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="purchases-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Artículos</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentPurchases.length > 0 ? (
              currentPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="purchase-id">#{purchase.id}</td>
                  <td style={{ fontWeight: '500', color: '#e4e4e7' }}>{purchase.supplier}</td>
                  <td>{purchase.date}</td>
                  <td>{purchase.itemsCount} unds</td>
                  <td style={{ color: '#10b981', fontWeight: '500' }}>{formatCurrency(purchase.total)}</td>
                  <td>
                    <span className={`status-badge-purchase ${purchase.status === 'Completado' ? 'status-completed' : 'status-pending'}`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(purchase)}><Eye size={18} /></button>
                      
                      {purchase.status !== 'Anulada' && (
                        <button className="btn-action btn-delete" title="Anular Compra" onClick={() => handleOpenDelete(purchase)}><Trash2 size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No hay compras registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button className="btn-page" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">
            Página {currentPage} de {totalPages}
          </span>
          <button className="btn-page" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <PurchaseModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} purchaseData={selectedPurchase} onSave={handleSavePurchase} />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Confirmar Anulación</h2>
              <button className="btn-close" onClick={handleCloseDelete}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>
                ¿Estás seguro de anular la compra <strong>#{purchaseToDelete?.id}</strong> al proveedor {purchaseToDelete?.supplier}? <br/><br/>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>Esto restará los productos que ingresaron al inventario.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDelete}>Cancelar</button>
              <button className="btn-danger" onClick={handleConfirmDelete}>Sí, anular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};