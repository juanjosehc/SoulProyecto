import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Eye, ShieldAlert, Power } from 'lucide-react';
import { ClientModal } from './components/ClientModal';
import './Clientes.css';

export const Clientes = () => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedClient, setSelectedClient] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // 1. CARGAR CLIENTES DESDE EL BACKEND
  const loadClients = async () => {
    try {
      // Endpoint sugerido para obtener usuarios que tengan el rol_id correspondiente a 'Cliente'
      const response = await fetch('http://localhost:3000/api/clientes');
      const data = await response.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // 2. GUARDAR O EDITAR CLIENTE EN EL BACKEND
  const handleSaveClient = async (clientData) => {
    try {
      const isEditing = clientData.id != null;
      const url = isEditing 
        ? `http://localhost:3000/api/clientes/${clientData.id}` 
        : 'http://localhost:3000/api/clientes';
      
      const method = isEditing ? 'PUT' : 'POST';

      // 🚨 ADAPTACIÓN AL BACKEND: Mapeamos a los campos exactos de tu tabla "usuarios"
      const payload = {
        nombres: clientData.nombres,
        apellidos: clientData.apellidos,
        correo: clientData.correo,
        telefono: clientData.telefono,
        direccion: clientData.direccion,
        estado: clientData.estado
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Ocurrió un error al guardar el cliente');
        return;
      }

      loadClients();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
    }
  };

  // 3. CAMBIAR ESTADO (Activo / Inactivo)
  const handleToggleStatus = async (clientId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/clientes/${clientId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: !currentStatus })
      });

      if (response.ok) {
        loadClients();
      }
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
    }
  };

  // 4. ELIMINAR CLIENTE
  const handleConfirmDelete = async () => {
    try {
      await fetch(`http://localhost:3000/api/clientes/${clientToDelete.id}`, {
        method: 'DELETE'
      });
      loadClients();
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleOpenCreate = () => { setModalMode('create'); setSelectedClient(null); setIsModalOpen(true); };
  const handleOpenEdit = (client) => { setModalMode('edit'); setSelectedClient(client); setIsModalOpen(true); };
  const handleOpenView = (client) => { setModalMode('view'); setSelectedClient(client); setIsModalOpen(true); };
  const handleOpenDelete = (client) => { setClientToDelete(client); setIsDeleteModalOpen(true); };
  const handleCloseDelete = () => { setIsDeleteModalOpen(false); setClientToDelete(null); };

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

  const filteredClients = clients.filter(client => {
    const term = searchTerm.toLowerCase();
    const fullName = `${client.nombres} ${client.apellidos}`.toLowerCase();
    return (
      fullName.includes(term) ||
      client.correo?.toLowerCase().includes(term) ||
      client.telefono?.includes(term)
    );
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="clients-module">
      <header className="clients-header">
        <div className="title-section">
          <Users size={28} className="title-icon" />
          <div>
            <h1>Gestión de Clientes</h1>
            <p>Administra la información de los usuarios registrados como clientes</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o teléfono..." 
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Nuevo Cliente
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentClients.length > 0 ? (
              currentClients.map((client) => (
                <tr key={client.id} className={!client.estado ? 'row-inactive' : ''}>
                  <td className="client-id">#{client.id}</td>
                  <td>
                    <div className="client-name">{client.nombres} {client.apellidos}</div>
                  </td>
                  <td className="client-email">{client.correo || '—'}</td>
                  <td>{client.telefono || '—'}</td>
                  <td className="address-cell" title={client.direccion}>{client.direccion || '—'}</td>
                  <td>
                    <span className={`status-badge ${client.estado ? 'active' : 'inactive'}`}>
                      {client.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action" title="Ver detalle" onClick={() => handleOpenView(client)}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-action" title="Editar" onClick={() => handleOpenEdit(client)}>
                        <Edit2 size={18} />
                      </button>
                      <button className={`btn-action ${!client.estado ? 'power-off' : ''}`} title="Cambiar estado" onClick={() => handleToggleStatus(client.id, client.estado)}>
                        <Power size={18} />
                      </button>
                      <button className="btn-action btn-delete" title="Eliminar" onClick={() => handleOpenDelete(client)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#a1a1aa' }}>
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="btn-page" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">
            Página {currentPage} de {totalPages}
          </span>
          <button 
            className="btn-page" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mode={modalMode} 
        clientData={selectedClient} 
        onSave={handleSaveClient} 
      />

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                <ShieldAlert size={24} /> Confirmar Eliminación
              </h2>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e4e4e7', fontSize: '15px' }}>
                ¿Estás seguro de que deseas eliminar permanentemente al cliente <strong>{clientToDelete?.nombres} {clientToDelete?.apellidos}</strong>?
                <br/><br/>
                Esta acción no se puede deshacer.
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