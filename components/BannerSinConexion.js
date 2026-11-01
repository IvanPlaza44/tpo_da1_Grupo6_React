import { StyleSheet, Text, View } from 'react-native';
import { useConexion } from '../hooks/useConexion';

// Cinta fija que solo aparece cuando no hay internet.
export default function BannerSinConexion() {
  const { conectado } = useConexion();
  if (conectado) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.texto}>Sin conexión. Se muestra la información guardada.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#92400e', paddingVertical: 6, paddingHorizontal: 12 },
  texto: { color: '#fff', fontSize: 13, textAlign: 'center' },
});