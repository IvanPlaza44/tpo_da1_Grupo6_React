import { CATEGORIAS } from '../utils/etiquetas';
import { formatearFecha } from '../utils/fechas';
import PublicationCard from './ui/PublicationCard';

export default function TarjetaSeguida({ publicacion, onPress }) {
  const { titulo, tipo, categoria, barrio, fechaSuceso, estado, fotoPrincipal, cambioEstado } = publicacion;

  return (
    <PublicationCard
      foto={fotoPrincipal}
      titulo={titulo}
      tipo={tipo}
      estado={estado}
      destacado={cambioEstado}
      linea={[CATEGORIAS[categoria], barrio, formatearFecha(fechaSuceso)].filter(Boolean).join(' · ')}
      detalle={cambioEstado ? 'Cambió de estado' : null}
      onPress={onPress}
    />
  );
}
