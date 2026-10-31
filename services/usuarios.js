import api from './api';

// Obtiene el perfil completo del usuario autenticado (GET /api/usuarios/me)
export const obtenerMiPerfil = async () => {
  const { data } = await api.get('/api/usuarios/me');
  return data;
};

// Actualiza los datos personales y preferencia de privacidad (PUT /api/usuarios/me)
export const actualizarMiPerfil = async ({
  nombre,
  telefono,
  telefonoVisible,
  barrio,
  username,
}) => {
  const payload = {
    nombre: nombre?.trim() || '',
    telefono: telefono?.trim() || '',
    telefonoVisible: Boolean(telefonoVisible),
    barrio: barrio?.trim() || '',
  };

  if (username?.trim()) {
    payload.username = username.trim();
  }

  const { data } = await api.put('/api/usuarios/me', payload);
  return data;
};

// Sube la foto de perfil en multipart/form-data bajo el campo "archivo" (POST /api/usuarios/me/foto)
export const subirFotoPerfil = async (imageAsset) => {
  const uri = typeof imageAsset === 'string' ? imageAsset : imageAsset.uri;
  const filename = imageAsset.fileName || uri.split('/').pop() || 'perfil.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = imageAsset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

  const formData = new FormData();
  formData.append('archivo', {
    uri,
    name: filename,
    type,
  });

  const { data } = await api.post('/api/usuarios/me/foto', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Obtiene el perfil público de un usuario por ID (GET /api/usuarios/{id})
export const obtenerPerfilPublico = async (usuarioId) => {
  const { data } = await api.get(`/api/usuarios/${usuarioId}`);
  return data;
};
