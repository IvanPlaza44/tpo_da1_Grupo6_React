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
            style={[styles.chip, activa && (op.valor === 'PERDIDO' ? styles.perdido : op.valor === 'ENCONTRADO' ? styles.encontrado : styles.chipActivo)]}
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
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: COLORS.surface },
  chipActivo: { backgroundColor: COLORS.primary },
  perdido: { backgroundColor: COLORS.perdido },
  encontrado: { backgroundColor: COLORS.encontrado },
  texto: { color: COLORS.text, fontWeight: '600' },
  textoActivo: { color: '#fff' },
});