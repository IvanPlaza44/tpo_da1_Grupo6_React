import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { CATEGORIAS, ESTADOS_PUBLICACION } from '../utils/etiquetas';
import { formatearFecha } from '../utils/fechas';

export default function TarjetaSeguida({ publicacion, onPress }) {
  const { titulo, tipo, categoria, barrio, fechaSuceso, estado, fotoPrincipal } = publicacion;

  return (
    <Pressable style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]} onPress={onPress}>
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
          {tipo === 'PERDIDO' ? 'Perdido' : 'Encontrado'} · {CATEGORIAS[categoria]}
        </Text>
        <Text style={styles.detalle}>
          {barrio} · {formatearFecha(fechaSuceso)}
        </Text>
        <Text style={styles.estado}>{ESTADOS_PUBLICACION[estado] ?? estado}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12 },
  presionada: { opacity: 0.6 },
  foto: { width: 72, height: 72, borderRadius: 4 },
  sinFoto: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  sinFotoTexto: { color: COLORS.muted, fontSize: 12 },
  info: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  detalle: { color: COLORS.muted },
  estado: { marginTop: 4, color: COLORS.text, fontWeight: 'bold' },
});
