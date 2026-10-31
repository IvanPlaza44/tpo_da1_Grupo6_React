import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { CATEGORIAS } from '../utils/etiquetas';
import { formatearFecha } from '../utils/fechas';

// Un caso resuelto del historial (devolví o recuperé).
export default function TarjetaCaso({ caso, onAbrirPerfil }) {
  const { rol, titulo, categoria, fechaDevolucion, fotoPrincipal, contraparte } = caso;

  return (
    <View style={styles.tarjeta}>
      {fotoPrincipal ? (
        <Image source={{ uri: fotoPrincipal }} style={styles.foto} />
      ) : (
        <View style={[styles.foto, styles.sinFoto]}>
          <Text style={styles.sinFotoTexto}>Sin foto</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={2}>{titulo}</Text>
        <Text style={styles.detalle}>
          {CATEGORIAS[categoria]} · {formatearFecha(fechaDevolucion)}
        </Text>
        <Text style={styles.contraparte}>
          {rol === 'DEVOLVI' ? 'Se lo devolviste a ' : 'Te lo devolvió '}
          <Text
            style={onAbrirPerfil && styles.enlace}
            onPress={onAbrirPerfil ? () => onAbrirPerfil(contraparte.id) : undefined}
          >
            {contraparte.nombre}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12 },
  foto: { width: 64, height: 64, borderRadius: 4 },
  sinFoto: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  sinFotoTexto: { color: COLORS.muted, fontSize: 12 },
  info: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  detalle: { color: COLORS.muted },
  contraparte: { marginTop: 4, color: COLORS.text },
  enlace: { color: COLORS.primary, fontWeight: 'bold' },
});
