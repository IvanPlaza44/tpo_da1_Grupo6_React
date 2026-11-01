import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../config';
import { CATEGORIAS } from '../config/filtros';
import { formatoDistancia } from '../utils/distancia';
import { formatearFecha as legible } from '../utils/fechas';

const nombreCategoria = (valor) =>
  CATEGORIAS.find((categoria) => categoria.value === valor)?.label || valor;

export default function ResultadoCard({ item, onPress }) {
  const tieneCoordenadas = item.latitud != null && item.longitud != null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {item.fotoPrincipal ? (
        <Image source={{ uri: item.fotoPrincipal }} style={styles.foto} />
      ) : (
        <View style={[styles.foto, styles.sinFoto]}>
          <Text style={styles.sinFotoTexto}>Sin foto</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={2}>
          {item.titulo || 'Sin título'}
        </Text>
        <Text style={styles.dato}>
          {nombreCategoria(item.categoria)} · {item.barrio || 'Sin barrio'}
        </Text>
        <Text style={styles.dato}>Fecha: {legible(item.fechaSuceso) || 'No indicada'}</Text>
        {tieneCoordenadas && (
          <Text style={styles.dato}>
            Coordenadas: {item.latitud.toFixed(4)}, {item.longitud.toFixed(4)}
          </Text>
        )}
        {item.distanciaKm != null && (
          <Text style={styles.distancia}>A {formatoDistancia(item.distanciaKm)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  foto: { width: 110, height: 110 },
  sinFoto: { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  sinFotoTexto: { color: COLORS.muted, fontSize: 12 },
  info: { flex: 1, padding: 10, gap: 2 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  dato: { fontSize: 13, color: COLORS.muted },
  distancia: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});