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

// Sube UNA foto a la publicación. Se manda como multipart/form-data (archivo + nombre + tipo).
export const subirFoto = async (id, foto) => {
  const formData = new FormData();
  formData.append('archivo', {
    uri: foto.uri,
    name: foto.fileName || `foto-${Date.now()}.jpg`,
    type: foto.mimeType || 'image/jpeg',
  });
  const response = await api.post(`/api/publicaciones/${id}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // subir imágenes tarda más que un request normal
  });
  return response.data;
};

// Pasa el borrador a ABIERTA (el backend valida que estén los datos obligatorios).
export const publicarPublicacion = async (id) => {
  const response = await api.post(`/api/publicaciones/${id}/publicar`);
  return response.data;
};

// Publicaciones propias que ya están publicadas (abierta, en reclamo, resuelta).
export const obtenerMisPublicaciones = async () => {
  const response = await api.get('/api/publicaciones/mias');
  return response.data;
};

// Publicaciones propias que todavía son borrador.
export const obtenerMisBorradores = async () => {
  const response = await api.get('/api/publicaciones/borradores');
  return response.data;
};

export const eliminarPublicacion = async (id) => {
  await api.delete(`/api/publicaciones/${id}`);
};