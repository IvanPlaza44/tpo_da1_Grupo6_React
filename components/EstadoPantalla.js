import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';

// Estados genéricos de una pantalla que carga datos: cargando, vacío y error.

export function EstadoCargando({ mensaje = 'Cargando…' }) {
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

export function EstadoVacio({ titulo, mensaje }) {
  return (
    <View style={styles.centro}>
      <Text style={styles.titulo}>{titulo}</Text>
      {mensaje ? <Text style={styles.texto}>{mensaje}</Text> : null}
    </View>
  );
}

export function EstadoError({ mensaje, onReintentar }) {
  return (
    <View style={styles.centro}>
      <Text style={[styles.titulo, styles.error]}>No se pudo cargar</Text>
      <Text style={styles.texto}>{mensaje}</Text>
      {onReintentar ? (
        <Pressable style={styles.boton} onPress={onReintentar}>
          <Text style={styles.botonTexto}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  texto: { color: COLORS.muted, textAlign: 'center' },
  error: { color: COLORS.danger },
  boton: { marginTop: 8, backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  botonTexto: { color: '#fff' },
});
