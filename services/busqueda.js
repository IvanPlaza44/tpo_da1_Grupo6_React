import api from './api';
import { sinVacios } from '../utils/filtros';

export const buscarPublicaciones = async (filtros) => {
  const { data } = await api.get('/api/publicaciones', { params: sinVacios(filtros) });
  return data;
};