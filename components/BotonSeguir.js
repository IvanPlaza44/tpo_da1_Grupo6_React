import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '../config';
import { dejarDeSeguir, seguirPublicacion } from '../services/seguidas';
import { getErrorMessage } from '../services/api';

// Botón para el detalle de una publicación.
// siguiendo: valor inicial, viene en PublicacionDetalleDto.siguiendo.
export default function BotonSeguir({ publicacionId, siguiendo: siguiendoInicial = false, onCambio }) {
  const [siguiendo, setSiguiendo] = useState(siguiendoInicial);
  const [enviando, setEnviando] = useState(false);

  const alternar = async () => {
    setEnviando(true);
    try {
      await (siguiendo ? dejarDeSeguir(publicacionId) : seguirPublicacion(publicacionId));
      setSiguiendo(!siguiendo);
      onCambio?.(!siguiendo);
    } catch (e) {
      Alert.alert('No se pudo completar la acción', getErrorMessage(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pressable
      style={[styles.boton, siguiendo && styles.siguiendo, enviando && styles.deshabilitado]}
      disabled={enviando}
      onPress={alternar}
    >
      {enviando ? (
        <ActivityIndicator color={siguiendo ? COLORS.primary : '#fff'} />
      ) : (
        <Text style={[styles.texto, siguiendo && styles.textoSiguiendo]}>
          {siguiendo ? 'Siguiendo' : 'Seguir publicación'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  siguiendo: { backgroundColor: COLORS.background },
  deshabilitado: { opacity: 0.6 },
  texto: { color: '#fff', fontWeight: 'bold' },
  textoSiguiendo: { color: COLORS.primary },
});
