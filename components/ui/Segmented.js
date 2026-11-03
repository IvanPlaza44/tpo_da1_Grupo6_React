import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../../config';

// Selector de dos o más opciones dentro de una misma sección.
export default function Segmented({ opciones, valor, onChange, etiqueta = 'value', texto = 'label' }) {
  return (
    <View style={styles.contenedor}>
      {opciones.map((opcion) => {
        const activo = opcion[etiqueta] === valor;
        return (
          <Pressable
            key={String(opcion[etiqueta])}
            style={[styles.opcion, activo && styles.opcionActiva]}
            onPress={() => onChange(opcion[etiqueta])}
          >
            <Text style={[styles.texto, activo && styles.textoActivo]}>{opcion[texto]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: 4,
    gap: 4,
  },
  opcion: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center' },
  opcionActiva: { backgroundColor: COLORS.primary },
  texto: { color: COLORS.muted, fontWeight: '600', fontSize: 14 },
  textoActivo: { color: COLORS.white },
});
