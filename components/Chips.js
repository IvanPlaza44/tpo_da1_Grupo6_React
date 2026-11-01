import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../config';

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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  texto: { color: COLORS.text },
  textoActivo: { color: '#fff', fontWeight: '600' },
});