import { useState, useEffect } from 'react';
import { Box, Plus, Edit2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { OrderModal } from './components/OrderModal';
import { formatCOP } from '../../../utils/currency';
import './Pedidos.css';

const API = 'http://localhost:3000/api';

export const Pedidos = () => {
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const cargarPedidos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/pedidos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    }
  };

  useEffect(() => { cargarPedidos(); }, []);

  const handleSaveOrder = async (orderData) => {
    try {
      const isEditing = orderData.id != null;
      const url = isEditing ? `${API}/pedidos/${orderData.id}` : `${API}/pedidos`;
      const method = isEditing ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al guardar pedido');
        return;
      }

      cargarPedidos();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar pedido:', error);
    }
  };

  const handleChangeStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/pedidos/${orderId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al cambiar estado');
        return;
      }

      cargarPedidos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleOpenCreate = () => { setModalMode('create'); setSelectedOrder(null); setIsModalOpen(true); };
  const handleOpenEdit = (order) => { setModalMode('edit'); setSelectedOrder(order); setIsModalOpen(true); };
  const handleOpenView = (order) => { setModalMode('view'); setSelectedOrder(order); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedOrder(null); };

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    return (
      order.clientName?.toLowerCase().includes(term) ||
      order.code?.toLowerCase().includes(term) ||
      order.orderStatus?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusClass = (status) => {
    switch(status) {
      case 'Pendiente': return 'status-pending';
      case 'En tránsito': return 'status-transit';
      case 'Completado': return 'status-completed';
      case 'Anulado': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="orders-module">
      <header className="orders-header">
        <div className="title-section">
          <Box size={28} className="title-icon" />
          <div>
            <h1>Gestión de Pedidos</h1>
            <p>Administra y da seguimiento a los pedidos de clientes</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar por cliente o código..." value={searchTerm} onChange={handleSearch} className="search-input" />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Nuevo Pedido
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Fecha Entrega</th>
              <th>Artículos</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length > 0 ? (
              currentOrders.map(order => (
                <tr key={order.id}>
                  <td className="order-code">{order.code}</td>
                  <td style={{ fontWeight: '500', color: '#e4e4e7' }}>{order.clientName}</td>
                  <td>{order.deliveryDate}</td>
                  <td>{order.itemsCount} unds</td>
                  <td style={{ color: '#C9A24D', fontWeight: '500' }}>{formatCOP(order.total)}</td>
                  <td>
                    {order.orderStatus === 'Completado' || order.orderStatus === 'Anulado' ? (
                      <span className={`status-badge ${getStatusClass(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    ) : (
                      <select
                        className="status-select"
                        value={order.orderStatus}
                        onChange={(e) => handleChangeStatus(order.id, e.target.value)}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En tránsito">En tránsito</option>
                        <option value="Completado">Completado</option>
                        <option value="Anulado">Anulado</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(order)}>
                        <Eye size={18} />
                      </button>
                      {order.orderStatus !== 'Completado' && order.orderStatus !== 'Anulado' && (
                        <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(order)}>
                          <Edit2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No hay pedidos registrados</td></tr>
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

      <OrderModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        mode={modalMode} 
        orderData={selectedOrder} 
        onSave={handleSaveOrder} 
      />
    </div>
  );
};