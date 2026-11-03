import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../../config';

export default function PasoIndicador({ actual, total, etiqueta }) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.barras}>
        {Array.from({ length: total }, (_, indice) => (
          <View key={indice} style={[styles.barra, indice < actual && styles.barraHecha]} />
        ))}
      </View>
      {etiqueta ? <Text style={styles.etiqueta}>{etiqueta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 8 },
  barras: { flexDirection: 'row', gap: 6 },
  barra: { flex: 1, height: 4, borderRadius: RADIUS.pill, backgroundColor: COLORS.border },
  barraHecha: { backgroundColor: COLORS.primary },
  etiqueta: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
});
