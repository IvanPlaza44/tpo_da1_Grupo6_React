import api from './api';

// Publicaciones seguidas (/api/publicaciones/{id}/seguir).
//
// EXPO_PUBLIC_MOCKS=true simula todo (sirve sin backend ni login).
// EXPO_PUBLIC_MOCKS=vacio | error simula todo y fuerza ese resultado en el listado.
// PENDIENTE marca lo que el backend todavía no tiene: queda simulado aunque se use
// el backend real. Pasar a false cuando el endpoint exista.
const MODO_MOCK = process.env.EXPO_PUBLIC_MOCKS;
const SOLO_MOCKS = ['true', 'vacio', 'error'].includes(MODO_MOCK);
const PENDIENTE = {
  listar: true, // GET /publicaciones/seguidas con campo `cambioEstado`
  marcarVista: true, // PATCH /publicaciones/{id}/seguir/visto
};

const demora = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// Misma forma que PublicacionResumenDto + `cambioEstado`.
let mockSeguidas = [
  {
    id: 10,
    tipo: 'ENCONTRADO',
    categoria: 'DOCUMENTOS',
    titulo: 'DNI encontrado en plaza',
    barrio: 'Almagro',
    fechaSuceso: '2026-10-28',
    latitud: -34.6037,
    longitud: -58.4206,
    fotoPrincipal: null,
    estado: 'EN_RECLAMO',
    fechaPublicacion: '2026-10-28T14:30:00',
    publicadorNombre: 'Lucía',
    cambioEstado: true,
  },
  {
    id: 11,
    tipo: 'PERDIDO',
    categoria: 'MASCOTAS',
    titulo: 'Gata gris perdida',
    barrio: 'Villa Crespo',
    fechaSuceso: '2026-10-25',
    latitud: -34.5986,
    longitud: -58.4372,
    fotoPrincipal: null,
    estado: 'ABIERTA',
    fechaPublicacion: '2026-10-25T09:10:00',
    publicadorNombre: 'Martín',
    cambioEstado: false,
  },
];

export const listarSeguidas = async () => {
  if (SOLO_MOCKS || PENDIENTE.listar) {
    await demora();
    if (MODO_MOCK === 'error') throw new Error('Error simulado');
    if (MODO_MOCK === 'vacio') return [];
    return mockSeguidas;
  }
  const { data } = await api.get('/api/publicaciones/seguidas');
  return data;
};

export const seguirPublicacion = async (publicacionId) => {
  if (SOLO_MOCKS) {
    await demora();
    return;
  }
  await api.post(`/api/publicaciones/${publicacionId}/seguir`);
};

export const dejarDeSeguir = async (publicacionId) => {
  if (SOLO_MOCKS) {
    await demora();
    mockSeguidas = mockSeguidas.filter((p) => p.id !== publicacionId);
    return;
  }
  await api.delete(`/api/publicaciones/${publicacionId}/seguir`);
  mockSeguidas = mockSeguidas.filter((p) => p.id !== publicacionId);
};

// Apaga el indicador de cambio de estado una vez que la persona vio la publicación.
export const marcarSeguidaVista = async (publicacionId) => {
  if (SOLO_MOCKS || PENDIENTE.marcarVista) {
    await demora();
    mockSeguidas = mockSeguidas.map((p) =>
      p.id === publicacionId ? { ...p, cambioEstado: false } : p
    );
    return;
  }
  await api.patch(`/api/publicaciones/${publicacionId}/seguir/visto`);
};
