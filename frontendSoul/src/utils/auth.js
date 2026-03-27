/**
 * Obtiene los headers de autenticación para las peticiones al API
 * @returns {Object} Headers con Authorization Bearer token
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Obtiene los headers de autenticación + Content-Type JSON
 * @returns {Object} Headers con Authorization y Content-Type
 */
export const getAuthJsonHeaders = () => {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };
};
