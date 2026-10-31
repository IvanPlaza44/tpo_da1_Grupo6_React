import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { CATEGORIAS, RANGOS_FECHA, TIPOS } from '../utils/etiquetas';
import { formatearFecha } from '../utils/fechas';
import Badge from './Badge';

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

export default function TarjetaAlerta({ alerta, ocupada = false, onPress, onAlternarPausa, onEliminar }) {
  const conNovedades = alerta.activa && alerta.hayNovedades;
  const criterios = [
    ['Tipo', TIPOS[alerta.tipo]],
    ['Categoría', CATEGORIAS[alerta.categoria]],
    ['Palabras clave', alerta.palabrasClave],
    ['Barrio', alerta.barrio],
    ['Cuándo', textoFecha(alerta)],
  ].filter(([, valor]) => valor);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tarjeta,
        !alerta.activa && styles.pausada,
        conNovedades && styles.tarjetaConNovedades,
        pressed && onPress && styles.presionada,
      ]}
      disabled={!onPress}
      onPress={onPress}
    >
      <View style={styles.encabezado}>
        <Text style={styles.nombre}>{alerta.nombre}</Text>
        {!alerta.activa ? <Text style={styles.etiquetaPausada}>Pausada</Text> : null}
        {conNovedades ? (
          <Badge texto={alerta.cantidadNovedades > 0 ? String(alerta.cantidadNovedades) : null} />
        ) : null}
      </View>
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
      <Text style={[styles.novedades, conNovedades && styles.conNovedades]}>
        {textoNovedades(alerta)}
      </Text>
      {onAlternarPausa || onEliminar ? (
        <View style={styles.acciones}>
          {ocupada ? <ActivityIndicator color={COLORS.primary} /> : null}
          {onAlternarPausa ? (
            <Pressable style={styles.accion} disabled={ocupada} onPress={onAlternarPausa}>
              <Text style={[styles.accionTexto, ocupada && styles.deshabilitado]}>
                {alerta.activa ? 'Pausar' : 'Reactivar'}
              </Text>
            </Pressable>
          ) : null}
          {onEliminar ? (
            <Pressable style={styles.accion} disabled={ocupada} onPress={onEliminar}>
              <Text style={[styles.accionTexto, styles.eliminar, ocupada && styles.deshabilitado]}>Eliminar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12, gap: 2 },
  pausada: { backgroundColor: '#f3f4f6' },
  tarjetaConNovedades: { borderColor: COLORS.primary, borderWidth: 2 },
  presionada: { opacity: 0.6 },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  nombre: { flex: 1, fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  etiquetaPausada: {
    color: COLORS.muted,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 8 },
  accion: { paddingVertical: 4 },
  accionTexto: { color: COLORS.primary, fontWeight: 'bold' },
  eliminar: { color: COLORS.danger },
  deshabilitado: { opacity: 0.4 },
  criterio: { color: COLORS.text },
  etiqueta: { color: COLORS.muted },
  novedades: { marginTop: 6, color: COLORS.muted },
  conNovedades: { color: COLORS.primary, fontWeight: 'bold' },
});
