import api from './api';
import { guardarCache, leerCache } from '../utils/cache';
import { sinVacios } from '../utils/filtros';

export const buscarPublicaciones = async (filtros) => {
  const { data } = await api.get('/api/publicaciones', { params: sinVacios(filtros) });
  return data;
};

// ---- Caché de búsquedas (punto 6: modo sin conexión) ----
// Se guarda la primera página de cada búsqueda y, aparte, la última búsqueda exitosa.
const claveBusqueda = (userId, filtros) =>
  `busqueda:${userId}:${JSON.stringify(Object.entries(sinVacios(filtros)).sort())}`;
const claveUltima = (userId) => `busqueda-ultima:${userId}`;

export const guardarBusqueda = async (userId, filtros, respuesta) => {
  await guardarCache(claveBusqueda(userId, filtros), respuesta);
  await guardarCache(claveUltima(userId), respuesta);
};

// Devuelve { respuesta, exacta } o null. `exacta` es false si no había nada guardado para
// estos filtros y se usó la última búsqueda exitosa (la que pide el enunciado).
export const leerBusquedaGuardada = async (userId, filtros) => {
  const propia = await leerCache(claveBusqueda(userId, filtros));
  if (propia) return { respuesta: propia.datos, exacta: true };
  const ultima = await leerCache(claveUltima(userId));
  if (ultima) return { respuesta: ultima.datos, exacta: false };
  return null;
};