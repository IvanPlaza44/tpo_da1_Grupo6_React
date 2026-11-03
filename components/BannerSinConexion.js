import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { useConexion } from '../hooks/useConexion';

// Cinta fija que solo aparece cuando no hay internet.
export default function BannerSinConexion() {
  const { conectado } = useConexion();
  if (conectado) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.texto}>Sin conexión. Mostramos lo último que se guardó en el teléfono.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: COLORS.warning, paddingVertical: 8, paddingHorizontal: 16 },
  texto: { color: COLORS.white, fontSize: 13, textAlign: 'center', fontWeight: '600' },
});
