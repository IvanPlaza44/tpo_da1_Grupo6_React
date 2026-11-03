import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../../config';
import StatusBadge from './StatusBadge';

// Tarjeta común de una publicación. La foto va arriba; el texto, debajo.
export default function PublicationCard({
  foto,
  titulo,
  tipo,
  estado,
  linea,
  detalle,
  extra,
  destacado,
  onPress,
  onLongPress,
  children,
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, destacado && styles.destacada, pressed && onPress && styles.presionada]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
    >
      {foto ? (
        <Image source={{ uri: foto }} style={styles.foto} />
      ) : (
        <View style={[styles.foto, styles.sinFoto]}>
          <Text style={styles.sinFotoTexto}>Sin foto</Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.badges}>
          {tipo ? <StatusBadge tipo={tipo} /> : null}
          {estado ? <StatusBadge estado={estado} /> : null}
        </View>
        <Text style={styles.titulo} numberOfLines={2}>
          {titulo || 'Sin título'}
        </Text>
        {linea ? (
          <Text style={styles.linea} numberOfLines={2}>
            {linea}
          </Text>
        ) : null}
        {detalle ? <Text style={styles.detalle}>{detalle}</Text> : null}
        {extra ? <Text style={styles.extra}>{extra}</Text> : null}
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    overflow: 'hidden',
  },
  destacada: { borderWidth: 1.5, borderColor: COLORS.primary },
  presionada: { opacity: 0.82 },
  foto: { width: '100%', height: 188, backgroundColor: COLORS.border },
  sinFoto: { alignItems: 'center', justifyContent: 'center' },
  sinFotoTexto: { color: COLORS.muted, fontSize: 13 },
  info: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  titulo: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  linea: { fontSize: 14, color: COLORS.muted },
  detalle: { fontSize: 13, color: COLORS.text },
  extra: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
