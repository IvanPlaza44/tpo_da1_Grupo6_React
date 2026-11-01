import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';

// Fila de opciones donde se elige UNA. Recibe:
//   opciones: [{ valor: 'LLAVES', label: 'Llaves' }, ...]
//   valor: la opción elegida ahora
//   onChange: función que se llama con el valor nuevo
export default function ChipSelector({ opciones, valor, onChange }) {
  return (
    <View style={styles.fila}>
      {opciones.map((op) => {
        const activa = op.valor === valor;
        return (
          <Pressable
            key={op.valor}
            style={[styles.chip, activa && styles.chipActivo]}
            onPress={() => onChange(op.valor)}
          >
            <Text style={[styles.texto, activa && styles.textoActivo]}>{op.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  chipActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  texto: { color: COLORS.text },
  textoActivo: { color: '#fff', fontWeight: 'bold' },
});