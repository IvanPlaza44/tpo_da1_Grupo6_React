import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS } from '../config';

// Fila de opciones seleccionables.
// Con permitirVacio, tocar la opción ya elegida la deselecciona (onChange recibe null).
export default function Chips({ opciones, valor, onChange, permitirVacio = false }) {
  return (
    <View style={styles.fila}>
      {opciones.map((opcion) => {
        const activo = opcion.value === valor;
        return (
          <TouchableOpacity
            key={opcion.value}
            style={[styles.chip, activo && styles.chipActivo]}
            onPress={() => onChange(activo && permitirVacio ? null : opcion.value)}
          >
            <Text style={[styles.texto, activo && styles.textoActivo]}>{opcion.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  chipActivo: { backgroundColor: COLORS.primary },
  texto: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  textoActivo: { color: COLORS.white },
});
