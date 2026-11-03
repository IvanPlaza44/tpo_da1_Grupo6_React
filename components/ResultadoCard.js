import { CATEGORIAS } from '../config/filtros';
import { formatoDistancia } from '../utils/distancia';
import { formatearFecha as legible } from '../utils/fechas';
import PublicationCard from './ui/PublicationCard';

const nombreCategoria = (valor) =>
  CATEGORIAS.find((categoria) => categoria.value === valor)?.label || valor;

export default function ResultadoCard({ item, onPress }) {
  const tieneCoordenadas = item.latitud != null && item.longitud != null;
  const fecha = legible(item.fechaSuceso);
  const ubicacion = tieneCoordenadas
    ? `Ubicación ${item.latitud.toFixed(4)}, ${item.longitud.toFixed(4)}`
    : null;
  const distancia = item.distanciaKm != null ? `A ${formatoDistancia(item.distanciaKm)}` : null;

  return (
    <PublicationCard
      foto={item.fotoPrincipal}
      titulo={item.titulo}
      tipo={item.tipo}
      linea={`${nombreCategoria(item.categoria)} · ${item.barrio || 'Sin barrio'}`}
      detalle={fecha ? `Fecha: ${fecha}` : 'Fecha no indicada'}
      extra={[ubicacion, distancia].filter(Boolean).join(' · ') || null}
      onPress={onPress}
    />
  );
}
