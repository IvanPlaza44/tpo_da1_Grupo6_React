import api from './api';
import { demora, obtenerCasos } from './mocks/historialMock';

// Historial de casos resueltos (devoluciones concretadas).
//
// EXPO_PUBLIC_MOCKS=true simula todo (sirve sin backend ni login).
// EXPO_PUBLIC_MOCKS=vacio | error simula todo y fuerza ese resultado en el listado.
// PENDIENTE marca lo que el backend todavía no tiene: queda simulado aunque se use
// el backend real. Pasar a false cuando el endpoint exista.
const MODO_MOCK = process.env.EXPO_PUBLIC_MOCKS;
const SOLO_MOCKS = ['true', 'vacio', 'error'].includes(MODO_MOCK);
const PENDIENTE = {
  listar: true, // GET /usuarios/me/historial
};

const filtrar = (casos, { rol, desde, hasta, tipo, categoria }) =>
  casos.filter((c) => {
    const dia = c.fechaDevolucion.slice(0, 10);
    return (
      (!rol || c.rol === rol) &&
      (!desde || dia >= desde) &&
      (!hasta || dia <= hasta) &&
      (!tipo || c.tipo === tipo) &&
      (!categoria || c.categoria === categoria)
    );
  });

// filtros: { rol: 'DEVOLVI' | 'RECUPERE', desde: 'YYYY-MM-DD', hasta: 'YYYY-MM-DD', tipo, categoria }
// Cada caso: { publicacionId, rol, fechaDevolucion, titulo, tipo, categoria, fotoPrincipal,
//   contraparte: { id, nombre }, miValoracion, yaValore, puedeValorar, fechaLimiteValoracion,
//   miAgradecimiento, yaAgradeci, puedeAgradecer }
export const listarHistorial = async (filtros = {}) => {
  if (SOLO_MOCKS || PENDIENTE.listar) {
    await demora();
    if (MODO_MOCK === 'error') throw new Error('Error simulado');
    if (MODO_MOCK === 'vacio') return [];
    return filtrar(obtenerCasos(), filtros).sort((a, b) => b.fechaDevolucion.localeCompare(a.fechaDevolucion));
  }
  const { data } = await api.get('/api/usuarios/me/historial', { params: filtros });
  return data;
};
