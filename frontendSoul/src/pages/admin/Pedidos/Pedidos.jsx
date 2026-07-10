import { useState, useEffect } from 'react';
import { Box, Plus, Edit2, Eye, Search, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { OrderModal } from './components/OrderModal';
import { formatCOP } from '../../../utils/currency';
import { generateRecordPDF } from '../../../utils/pdfGenerator';
import './Pedidos.css';

import { API_URL } from '../../../config/api';

export const Pedidos = () => {
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Estados para justificación de anulación
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [domiciliarios, setDomiciliarios] = useState([]);
  const [selectedDomiciliarioId, setSelectedDomiciliarioId] = useState('');
  const [assignError, setAssignError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [loading, setLoading] = useState(false);


  const cargarPedidos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/pedidos`, {
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
    setLoading(true);
    try {
      const isEditing = orderData.id != null;
      const url = isEditing ? `${API_URL}/pedidos/${orderData.id}` : `${API_URL}/pedidos`;
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
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (orderId, newStatus, currentOrder) => {
    if (newStatus === 'Anulado') {
      setCancellingOrderId(orderId);
      setCancelReason('');
      setCancelError('');
      setIsCancelModalOpen(true);
      return;
    }
    // When transitioning to "En tránsito", require driver assignment
    if (newStatus === 'En tránsito') {
      setAssigningOrder(currentOrder);
      setSelectedDomiciliarioId(currentOrder.usuarioId || '');
      setAssignError('');
      setIsAssignModalOpen(true);
      // Fetch domiciliarios list if not already loaded
      if (domiciliarios.length === 0) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/usuarios/search/domiciliarios?q=`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDomiciliarios(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.error('Error al cargar domiciliarios:', e);
        }
      }
      return;
    }
    await procederCambioEstado(orderId, newStatus);
  };


  const procederCambioEstado = async (orderId, newStatus, motivoAnulacion = '', usuarioId = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = { estado: newStatus, motivo_anulacion: motivoAnulacion };
      if (usuarioId != null) body.usuarioId = usuarioId;
      const res = await fetch(`${API_URL}/pedidos/${orderId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al cambiar estado');
        return;
      }

      cargarPedidos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('El motivo de anulación es obligatorio.');
      return;
    }
    await procederCambioEstado(cancellingOrderId, 'Anulado', cancelReason);
    setIsCancelModalOpen(false);
    setCancellingOrderId(null);
    setCancelReason('');
  };

  const handleConfirmAssign = async () => {
    if (!selectedDomiciliarioId) {
      setAssignError('Debes seleccionar un domiciliario para continuar.');
      return;
    }
    await procederCambioEstado(assigningOrder.id, 'En tránsito', '', Number(selectedDomiciliarioId));
    setIsAssignModalOpen(false);
    setAssigningOrder(null);
    setSelectedDomiciliarioId('');
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

  const handleGeneratePDF = (order) => {
    const metaInfo = [
      { label: 'Código', value: order.code },
      { label: 'Fecha Entrega', value: order.deliveryDate },
      { label: 'Cliente', value: order.clientName },
      { label: 'Dirección de entrega', value: order.deliveryAddress || 'No especificada' },
      { label: 'Número de teléfono', value: order.phone || 'No especificado' },
      { label: 'Observación de pedido', value: order.observations || 'Ninguna' },
      { label: 'Estado', value: order.orderStatus }
    ];

    const columns = ['Producto', 'Talla', 'Cantidad', 'Precio Unit.', 'Subtotal'];
    const rows = order.items?.map(item => [
      item.product,
      item.talla,
      item.cantidad,
      formatCOP(item.valorUnitario),
      formatCOP(item.total)
    ]) || [];

    generateRecordPDF(
      `Detalle de Pedido ${order.code}`,
      metaInfo,
      columns,
      rows,
      order.total,
      `Pedido_SOUL_${order.code}.pdf`
    );
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
            <input type="text" placeholder="Buscar por cliente o código..." value={searchTerm} onChange={handleSearch} disabled={loading} className="search-input" />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate} disabled={loading}>
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
                        className={`status-select ${getStatusClass(order.orderStatus)}`}
                        value={order.orderStatus}
                        onChange={(e) => handleChangeStatus(order.id, e.target.value, order)}
                        disabled={loading}
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
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(order)} disabled={loading}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-action" title="Descargar PDF" onClick={() => handleGeneratePDF(order)} disabled={loading}>
                        <FileText size={18} />
                      </button>
                      {order.orderStatus !== 'Completado' && order.orderStatus !== 'Anulado' && (
                        <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(order)} disabled={loading}>
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
          <button className="btn-page" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1 || loading}>
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">Página {currentPage} de {totalPages}</span>
          <button className="btn-page" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || loading}>
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
        loading={loading}
      />

      {/* MODAL DE CONFIRMACIÓN DE ANULACIÓN CON JUSTIFICACIÓN */}
      {isCancelModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Justificar Anulación</h2>
              <button className="btn-close" onClick={() => setIsCancelModalOpen(false)} disabled={loading}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontWeight: 'bold' }}>Motivo de la Anulación *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => { setCancelReason(e.target.value); setCancelError(''); }}
                  placeholder="Escribe el por qué se anula este pedido..."
                  rows="4"
                  className="textarea-field"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#ffffff', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical' }}
                  disabled={loading}
                />
                {cancelError && <span className="error-text" style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{cancelError}</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsCancelModalOpen(false)} disabled={loading}>Cancelar</button>
              <button className="btn-danger" onClick={handleConfirmCancel} disabled={loading}>
                {loading ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE ASIGNACIÓN DE DOMICILIARIO (para pasar a "En tránsito") */}
      {isAssignModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2>Asignar Domiciliario</h2>
              <button className="btn-close" onClick={() => setIsAssignModalOpen(false)} disabled={loading}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#a1a1aa', marginBottom: '12px', fontSize: '14px' }}>
                Selecciona el domiciliario que realizará la entrega del pedido <strong style={{ color: '#C9A24D' }}>{assigningOrder?.code}</strong>.
              </p>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontWeight: 'bold' }}>Domiciliario *</label>
                <select
                  value={selectedDomiciliarioId}
                  onChange={(e) => { setSelectedDomiciliarioId(e.target.value); setAssignError(''); }}
                  disabled={loading}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#ffffff', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="">-- Seleccionar domiciliario --</option>
                  {domiciliarios.map(d => (
                    <option key={d.id} value={d.id}>{d.name || d.nombre}</option>
                  ))}
                </select>
                {assignError && <span className="error-text" style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{assignError}</span>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsAssignModalOpen(false)} disabled={loading}>Cancelar</button>
              <button className="btn-primary" onClick={handleConfirmAssign} disabled={loading}>
                {loading ? 'Asignando...' : 'Confirmar y Poner en Tránsito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};