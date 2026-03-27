import { useState, useEffect } from 'react';
import { Truck, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DeliveryModal } from './components/DeliveryModal';
import './Entregas.css';

const API = 'http://localhost:3000/api';

export const Entregas = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const cargarEntregas = async () => {
    try {
      const res = await fetch(`${API}/entregas`);
      const data = await res.json();
      if (Array.isArray(data)) setDeliveries(data);
    } catch (error) {
      console.error('Error al cargar entregas:', error);
    }
  };

  useEffect(() => { cargarEntregas(); }, []);

  const handleOpenView = (delivery) => { setSelectedDelivery(delivery); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedDelivery(null); };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/entregas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al cambiar estado');
        return;
      }

      cargarEntregas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredDeliveries = deliveries.filter(d => {
    const term = searchTerm.toLowerCase();
    return (d.trackingCode || '').toLowerCase().includes(term) || 
           (d.orderCode || '').toLowerCase().includes(term) ||
           (d.clientName || '').toLowerCase().includes(term) ||
           (d.deliveryPerson || '').toLowerCase().includes(term) ||
           (d.status || '').toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage) || 1;
  const currentDeliveries = filteredDeliveries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusClass = (status) => {
    if (status === 'Completado' || status === 'Entregado') return 'status-entregado';
    if (status === 'En tránsito' || status === 'En camino') return 'status-camino';
    if (status === 'Anulado' || status === 'Fallido') return 'status-fallido';
    return 'status-pendiente'; 
  };

  return (
    <div className="deliveries-module">
      <header className="deliveries-header">
        <div className="title-section">
          <Truck size={28} className="title-icon" />
          <div>
            <h1>Entregas</h1>
            <p>Seguimiento de pedidos en tránsito y entregas completadas</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" placeholder="Buscar por guía, pedido, cliente..." 
              className="search-input" value={searchTerm} onChange={handleSearch} 
            />
          </div>
        </div>
      </header>

      <div className="table-container">
        <table className="deliveries-table">
          <thead>
            <tr>
              <th>Guía</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Dirección</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentDeliveries.length > 0 ? (
              currentDeliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="tracking-code">{delivery.trackingCode || `ENT-${delivery.id}`}</td>
                  <td className="order-ref">{delivery.orderCode || `PED-${delivery.orderId}`}</td>
                  <td style={{ fontWeight: '500', color: '#e4e4e7' }}>{delivery.clientName}</td>
                  <td style={{ color: '#a1a1aa', fontSize: '13px' }}>{delivery.address || delivery.deliveryAddress}</td>
                  <td>{delivery.date || delivery.deliveryDate}</td>
                  <td>
                    {delivery.status === 'Completado' || delivery.status === 'Anulado' ? (
                      <span className={`delivery-status-badge ${getStatusClass(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    ) : (
                      <select
                        className="status-select-delivery"
                        value={delivery.status || 'En tránsito'}
                        onChange={(e) => handleChangeStatus(delivery.id, e.target.value)}
                      >
                        <option value="En tránsito">En tránsito</option>
                        <option value="Completado">Completado</option>
                        <option value="Anulado">Anulado</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(delivery)}>
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>
                  No hay entregas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button className="btn-page" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">Página {currentPage} de {totalPages}</span>
          <button className="btn-page" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal solo de vista para detalle */}
      <DeliveryModal isOpen={isModalOpen} onClose={handleCloseModal} mode="view" deliveryData={selectedDelivery} onSave={() => {}} />
    </div>
  );
};