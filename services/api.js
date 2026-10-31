import axios from 'axios';
import { API_URL } from '../config';
import { getToken, removeToken } from '../utils/storage';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Antes de CADA request: si hay token guardado, lo agrega al header.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// El AuthContext registra acá qué hacer cuando la sesión expira.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// Después de CADA respuesta: si el backend dice 401, la sesión murió.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Saca un mensaje legible de un error. El backend responde { mensaje: "..." }.
export const getErrorMessage = (error) =>
  error.response?.data?.mensaje ||
  (error.request ? 'No hay conexión con el servidor' : 'Ocurrió un error inesperado');

export default api;