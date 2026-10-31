import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { CATEGORIAS, RANGOS_FECHA, TIPOS } from '../utils/etiquetas';
import { formatearFecha } from '../utils/fechas';

const textoFecha = ({ rangoFecha, fechaDesde, fechaHasta }) => {
  if (rangoFecha !== 'RANGO') return RANGOS_FECHA[rangoFecha];
  if (fechaDesde && fechaHasta) return `${formatearFecha(fechaDesde)} al ${formatearFecha(fechaHasta)}`;
  if (fechaDesde) return `Desde ${formatearFecha(fechaDesde)}`;
  if (fechaHasta) return `Hasta ${formatearFecha(fechaHasta)}`;
  return RANGOS_FECHA.RANGO;
};

// cantidadNovedades es null cuando el backend solo informa que hay novedades, sin el número.
const textoNovedades = ({ hayNovedades, cantidadNovedades }) => {
  if (cantidadNovedades > 0) {
    return cantidadNovedades === 1 ? '1 publicación nueva' : `${cantidadNovedades} publicaciones nuevas`;
  }
  return hayNovedades ? 'Hay publicaciones nuevas' : 'Sin novedades';
};

export default function TarjetaAlerta({ alerta }) {
  const criterios = [
    ['Tipo', TIPOS[alerta.tipo]],
    ['Categoría', CATEGORIAS[alerta.categoria]],
    ['Palabras clave', alerta.palabrasClave],
    ['Barrio', alerta.barrio],
    ['Cuándo', textoFecha(alerta)],
  ].filter(([, valor]) => valor);

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.nombre}>{alerta.nombre}</Text>
      {criterios.length > 0 ? (
        criterios.map(([etiqueta, valor]) => (
          <Text key={etiqueta} style={styles.criterio}>
            <Text style={styles.etiqueta}>{etiqueta}: </Text>
            {valor}
          </Text>
        ))
      ) : (
        <Text style={styles.criterio}>Sin filtros</Text>
      )}
      <Text style={[styles.novedades, alerta.hayNovedades && styles.conNovedades]}>
        {textoNovedades(alerta)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12, gap: 2 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  criterio: { color: COLORS.text },
  etiqueta: { color: COLORS.muted },
  novedades: { marginTop: 6, color: COLORS.muted },
  conNovedades: { color: COLORS.primary, fontWeight: 'bold' },
});
