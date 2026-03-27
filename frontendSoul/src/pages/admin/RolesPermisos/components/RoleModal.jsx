import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import './RoleModal.css';

const modulosDisponibles = [
  'Dashboard', 'Roles y permisos', 'Usuarios', 'Categorías',
  'Productos', 'Proveedores', 'Compras', 'Clientes',
  'Ventas', 'Pedidos', 'Entregas'
];

export const RoleModal = ({ isOpen, onClose, mode, roleData, onSave }) => {
  const [nombreRol, setNombreRol] = useState('');
  const [permisos, setPermisos] = useState([]);
  
  // NUEVO: Estado para manejar el error de validación
  const [error, setError] = useState(false); 

  useEffect(() => {
    if (isOpen && roleData && (mode === 'edit' || mode === 'view')) {
      setNombreRol(roleData.name || '');
      setPermisos(roleData.permisos || []); 
      setError(false); // Limpiamos el error al abrir
    } else if (isOpen && mode === 'create') {
      setNombreRol('');
      setPermisos([]);
      setError(false); // Limpiamos el error al abrir
    }
  }, [isOpen, mode, roleData]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const title = mode === 'create' ? 'Registrar Rol' : mode === 'edit' ? 'Editar Rol' : 'Detalle del Rol';
  const buttonText = mode === 'create' ? 'Crear Rol' : 'Guardar Cambios';

  const handleCheckboxChange = (modulo) => {
    if (isViewOnly) return;
    if (permisos.includes(modulo)) {
      setPermisos(permisos.filter(p => p !== modulo));
    } else {
      setPermisos([...permisos, modulo]);
    }
  };

  const handleSubmit = () => {
    // NUEVO: Validación visual en lugar de alert()
    if (nombreRol.trim() === '') {
      setError(true);
      return;
    }

    const dataToSave = {
      id: roleData ? roleData.id : null, 
      name: nombreRol,
      permisos: permisos,
      modulesCount: permisos.length, 
      isActive: roleData ? roleData.isActive : true 
    };

    onSave(dataToSave);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-close" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label>
              Nombre del Rol
              {/* Solo mostramos el asterisco si no estamos en modo vista */}
              {!isViewOnly && <span className="required-asterisk">*</span>}
            </label>
            <input 
              type="text" 
              value={nombreRol}
              onChange={(e) => {
                setNombreRol(e.target.value);
                if (error) setError(false); // Quitamos el error en cuanto el usuario empiece a escribir
              }}
              disabled={isViewOnly}
              placeholder="Ej: Administrador"
              className={error ? 'input-error' : ''} // Aplicamos la clase roja si hay error
            />
            {/* Mensaje de error que aparece debajo del input */}
            {error && <span className="error-text">El nombre del rol es obligatorio.</span>}
          </div>

          <div className="permissions-group">
            <label>Permisos del Rol</label>
            <p className="permissions-subtitle">Selecciona los módulos a los que tendrá acceso este rol:</p>
            
            <div className="permissions-grid">
              {modulosDisponibles.map((modulo) => {
                const isChecked = permisos.includes(modulo);
                return (
                  <label key={modulo} className={`checkbox-label ${isChecked ? 'selected' : ''} ${isViewOnly ? 'disabled' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(modulo)}
                      disabled={isViewOnly}
                    />
                    <span>{modulo}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {!isViewOnly && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary-modal" onClick={handleSubmit}>
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};