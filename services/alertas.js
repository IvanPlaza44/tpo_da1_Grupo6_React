import api from './api';

// Alertas = búsquedas guardadas (/api/busquedas-guardadas).
//
// EXPO_PUBLIC_MOCKS=true simula todo (sirve sin backend ni login).
// EXPO_PUBLIC_MOCKS=vacio | error simula todo y fuerza ese resultado en el listado.
// PENDIENTE marca lo que el backend todavía no tiene: queda simulado aunque se use
// el backend real. Pasar a false cuando el endpoint exista.
const MODO_MOCK = process.env.EXPO_PUBLIC_MOCKS;
const SOLO_MOCKS = ['true', 'vacio', 'error'].includes(MODO_MOCK);
const PENDIENTE = {
  pausar: true, // PATCH /busquedas-guardadas/{id}/pausar y /reactivar + campo `activa`
};

const demora = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

let mockAlertas = [
  {
    id: 1,
    nombre: 'Llaves en Palermo',
    hayNovedades: true,
    cantidadNovedades: 2,
    activa: true,
    tipo: 'PERDIDO',
    categoria: 'LLAVES',
    palabrasClave: 'llavero rojo',
    barrio: 'Palermo',
    rangoFecha: 'ULTIMA_SEMANA',
    fechaDesde: null,
    fechaHasta: null,
  },
  {
    id: 2,
    nombre: 'Perro encontrado en Caballito',
    hayNovedades: false,
    cantidadNovedades: 0,
    activa: false,
    tipo: 'ENCONTRADO',
    categoria: 'MASCOTAS',
    palabrasClave: null,
    barrio: 'Caballito',
    rangoFecha: 'HOY',
    fechaDesde: null,
    fechaHasta: null,
  },
];
let mockSiguienteId = 3;

// Pausa simulada sobre alertas reales mientras PENDIENTE.pausar sea true. Se pierde al recargar.
const pausadas = new Set();

// El backend devuelve `hayNovedades` (boolean). `cantidadNovedades` queda null si no la manda.
const normalizar = (alerta) => ({
  ...alerta,
  activa: alerta.activa ?? !pausadas.has(alerta.id),
  cantidadNovedades: alerta.cantidadNovedades ?? (alerta.hayNovedades ? null : 0),
});

export const listarAlertas = async () => {
  if (SOLO_MOCKS) {
    await demora();
    if (MODO_MOCK === 'error') throw new Error('Error simulado');
    if (MODO_MOCK === 'vacio') return [];
    return mockAlertas.map(normalizar);
  }
  const { data } = await api.get('/api/busquedas-guardadas');
  return data.map(normalizar);
};

// criterios: { nombre, tipo, categoria, palabrasClave, barrio, rangoFecha, fechaDesde, fechaHasta }
export const crearAlerta = async (criterios) => {
  if (SOLO_MOCKS) {
    await demora();
    if (MODO_MOCK === 'error') throw new Error('Error simulado');
    const nueva = {
      tipo: null,
      categoria: null,
      palabrasClave: null,
      barrio: null,
      rangoFecha: null,
      fechaDesde: null,
      fechaHasta: null,
      ...criterios,
      id: mockSiguienteId++,
      hayNovedades: false,
      cantidadNovedades: 0,
      activa: true,
    };
    mockAlertas = [...mockAlertas, nueva];
    return normalizar(nueva);
  }
  const { data } = await api.post('/api/busquedas-guardadas', criterios);
  return normalizar(data);
};

export const marcarAlertaRevisada = async (id) => {
  if (SOLO_MOCKS) {
    await demora();
    mockAlertas = mockAlertas.map((a) =>
      a.id === id ? { ...a, hayNovedades: false, cantidadNovedades: 0 } : a
    );
    return;
  }
  await api.patch(`/api/busquedas-guardadas/${id}/revisar`);
};

const cambiarActiva = async (id, activa) => {
  if (SOLO_MOCKS) {
    await demora();
    mockAlertas = mockAlertas.map((a) => (a.id === id ? { ...a, activa } : a));
    return;
  }
  if (PENDIENTE.pausar) {
    await demora();
    if (activa) pausadas.delete(id);
    else pausadas.add(id);
    return;
  }
  await api.patch(`/api/busquedas-guardadas/${id}/${activa ? 'reactivar' : 'pausar'}`);
};

export const pausarAlerta = (id) => cambiarActiva(id, false);
export const reactivarAlerta = (id) => cambiarActiva(id, true);

export const eliminarAlerta = async (id) => {
  if (SOLO_MOCKS) {
    await demora();
    mockAlertas = mockAlertas.filter((a) => a.id !== id);
    return;
  }
  await api.delete(`/api/busquedas-guardadas/${id}`);
  pausadas.delete(id);
};
