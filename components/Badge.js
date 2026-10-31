import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';

// Indicador de novedad. Sin `texto` se muestra como un punto.
export default function Badge({ texto }) {
  if (texto === undefined || texto === null || texto === '') {
    return <View style={styles.punto} />;
  }
  return (
    <View style={styles.badge}>
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
