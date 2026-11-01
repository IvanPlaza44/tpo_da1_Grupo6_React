import api from './api';

// Crea la publicación con lo mínimo (el tipo). El backend devuelve el objeto con su id.
export const crearPublicacion = async (datos) => {
  const response = await api.post('/api/publicaciones', datos);
  return response.data;
};

// Completa o modifica campos. El backend solo pisa los campos que mandás (los null los ignora).
export const actualizarPublicacion = async (id, datos) => {
  const response = await api.put(`/api/publicaciones/${id}`, datos);
  return response.data;
};