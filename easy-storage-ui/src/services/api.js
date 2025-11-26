// src/services/api.js
import { useAuth } from '../composables/useAuth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const { token } = useAuth();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inyectar Token si existe
  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Token expirado o inválido
    const { logout } = useAuth();
    logout();
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }

  return response.json();
}

export default {
  checkHealth: () => request('/health'),
  
  // Auth: Obtener URL de inicio (Google)
  startGoogleAuth: () => request('/auth/google/start'),

  submitJob: (data) => request('/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getJobStatus: (jobId) => request(`/status/${jobId}`),

  searchMedia: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/search?${query}`);
  },

  getMediaContentBlob: async (mediaId) => {
    const { token } = useAuth();
    
    const headers = {};
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    const response = await fetch(`${BASE_URL}/media/${mediaId}/content`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Error cargando imagen: ${response.status}`);
    }

    // Aquí está la clave: devolvemos un Blob (archivo binario en memoria)
    return await response.blob();
  }
};