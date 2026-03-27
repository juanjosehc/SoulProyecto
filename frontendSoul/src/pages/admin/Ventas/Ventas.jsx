import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Eye, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { SaleModal } from './components/SaleModal';
import { formatCOP } from '../../../utils/currency';
import { generateRecordPDF } from '../../../utils/pdfGenerator';
import './Ventas.css';

const API = 'http://localhost:3000/api';

export const Ventas = () => {
  const [sales, setSales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedSale, setSelectedSale] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const cargarVentas = async () => {
    try {
      const res = await fetch(`${API}/ventas`);
      const data = await res.json();
      if (Array.isArray(data)) setSales(data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  };

  useEffect(() => { cargarVentas(); }, []);

  const handleSaveSale = async (saleData) => {
    try {
      const res = await fetch(`${API}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al registrar venta');
        return;
      }

      cargarVentas();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar venta:', error);
    }
  };

  const handleAnular = async (saleId) => {
    if (!confirm('¿Estás seguro de anular esta venta? Se restaurará el stock.')) return;
    try {
      const res = await fetch(`${API}/ventas/${saleId}/anular`, { method: 'PATCH' });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al anular venta');
        return;
      }
      cargarVentas();
    } catch (error) {
      console.error('Error al anular:', error);
    }
  };

  const handleOpenCreate = () => { setModalMode('create'); setSelectedSale(null); setIsModalOpen(true); };
  const handleOpenView = (sale) => { setModalMode('view'); setSelectedSale(sale); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedSale(null); };

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const filteredSales = sales.filter(sale => {
    const term = searchTerm.toLowerCase();
    return (
      sale.clientName?.toLowerCase().includes(term) ||
      sale.code?.toLowerCase().includes(term) ||
      sale.status?.toLowerCase().includes(term) ||
      sale.origin?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const currentSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusClass = (status) => {
    switch(status) {
      case 'Completado': return 'status-completed';
      case 'Anulada': return 'status-cancelled';
      default: return 'status-active';
    }
  };

  const getOriginBadge = (origin) => {
    switch(origin) {
      case 'Pedido': return 'origin-order';
      case 'Entrega': return 'origin-delivery';
      default: return 'origin-manual';
    }
  };

  const handleGeneratePDF = (sale) => {
    const metaInfo = [
      { label: 'Factura / Código', value: sale.code },
      { label: 'Fecha Venta', value: sale.saleDate },
      { label: 'Cliente', value: sale.clientName },
      { label: 'Estado', value: sale.status },
      { label: 'Origen', value: sale.origin || 'Manual' }
    ];

    const columns = ['Producto', 'Talla', 'Cantidad', 'Precio Unit.', 'Subtotal'];
    const rows = sale.items?.map(item => [
      item.product,
      item.talla,
      item.cantidad,
      formatCOP(item.valorUnitario),
      formatCOP(item.total)
    ]) || [];

    generateRecordPDF(
      `Detalle de Venta ${sale.code}`,
      metaInfo,
      columns,
      rows,
      sale.total,
      `Venta_SOUL_${sale.code}.pdf`
    );
  };

  return (
    <div className="sales-module">
      <header className="sales-header">
        <div className="title-section">
          <TrendingUp size={28} className="title-icon" />
          <div>
            <h1>Gestión de Ventas</h1>
            <p>Registro de ventas manuales y automáticas del sistema</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar por cliente o código..." value={searchTerm} onChange={handleSearch} className="search-input" />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Registrar Venta
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Origen</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentSales.length > 0 ? (
              currentSales.map(sale => (
                <tr key={sale.id}>
                  <td className="sale-code">{sale.code}</td>
                  <td style={{ fontWeight: '500', color: '#e4e4e7' }}>{sale.clientName}</td>
                  <td>{sale.saleDate}</td>
                  <td style={{ color: '#10b981', fontWeight: '500' }}>{formatCOP(sale.total)}</td>
                  <td>
                    <span className={`origin-badge ${getOriginBadge(sale.origin)}`}>
                      {sale.origin || 'Manual'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(sale)}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-action" title="Descargar PDF" onClick={() => handleGeneratePDF(sale)}>
                        <FileText size={18} />
                      </button>
                      {sale.status !== 'Anulada' && (
                        <button className="btn-action btn-delete" title="Anular venta" onClick={() => handleAnular(sale.id)}>
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No hay ventas registradas</td></tr>
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

      <SaleModal isOpen={isModalOpen} onClose={handleCloseModal} mode={modalMode} saleData={selectedSale} onSave={handleSaveSale} />
    </div>
  );
};