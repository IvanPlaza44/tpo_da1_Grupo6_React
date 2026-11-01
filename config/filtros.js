import { CATEGORIAS as ETIQUETAS_CATEGORIAS, TIPOS as ETIQUETAS_TIPOS } from '../utils/etiquetas';

const aOpcionesBusqueda = (etiquetas) =>
  Object.keys(etiquetas).map((value) => ({ value, label: etiquetas[value] }));

export const TIPOS = aOpcionesBusqueda(ETIQUETAS_TIPOS);
export const CATEGORIAS = aOpcionesBusqueda(ETIQUETAS_CATEGORIAS);

export const RANGOS = [
  { value: 'HOY', label: 'Hoy' },
  { value: 'ULTIMOS_3_DIAS', label: 'Últimos 3 días' },
  { value: 'ULTIMA_SEMANA', label: 'Última semana' },
  { value: 'RANGO', label: 'Elegir fechas' },
];

export const ORDENES = [
  { value: 'RECIENTES', label: 'Más recientes' },
  { value: 'CERCANOS', label: 'Más cercanos' },
];

export const BARRIOS = [
  'Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo',
  'Caballito', 'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores',
  'Floresta', 'La Boca', 'Liniers', 'Mataderos', 'Monserrat', 'Nueva Pompeya',
  'Núñez', 'Palermo', 'Parque Chacabuco', 'Paternal', 'Puerto Madero',
  'Recoleta', 'Retiro', 'Saavedra', 'San Cristóbal', 'San Nicolás',
  'San Telmo', 'Villa Crespo', 'Villa del Parque', 'Villa Devoto',
  'Villa Lugano', 'Villa Urquiza',
];