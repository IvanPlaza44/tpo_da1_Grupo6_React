import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../config';

export function EstadoCargando({ mensaje = 'Cargando…' }) {
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

export function EstadoVacio({ titulo, mensaje, accionTexto, onAccion, children }) {
  return (
    <View style={styles.centro}>
      <View style={styles.circulo}>
        <View style={styles.circuloMarca} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {mensaje ? <Text style={styles.texto}>{mensaje}</Text> : null}
      {onAccion && accionTexto ? (
        <Pressable style={styles.boton} onPress={onAccion}>
          <Text style={styles.botonTexto}>{accionTexto}</Text>
        </Pressable>
      ) : null}
      {children}
    </View>
  );
}

export function EstadoError({ mensaje, onReintentar }) {
  return (
    <View style={styles.centro}>
      <Text style={styles.titulo}>No pudimos cargar esto</Text>
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
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
    paddingVertical: SPACE.xxl,
    gap: SPACE.sm,
  },
  circulo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.sm,
  },
  circuloMarca: { width: 22, height: 4, borderRadius: RADIUS.pill, backgroundColor: COLORS.primary },
  titulo: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  texto: { color: COLORS.muted, textAlign: 'center', lineHeight: 20, fontSize: 14 },
  boton: {
    marginTop: SPACE.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: RADIUS.pill,
  },
  botonTexto: { color: COLORS.white, fontWeight: '700' },
});
