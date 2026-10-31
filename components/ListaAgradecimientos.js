import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { listarAgradecimientos } from '../services/valoraciones';
import useListado from '../hooks/useListado';
import { formatearFecha } from '../utils/fechas';

// Agradecimientos públicos que recibió un usuario, para mostrar dentro de su perfil.
// No usa FlatList para poder ir dentro del ScrollView del perfil.
export default function ListaAgradecimientos({ usuarioId }) {
  const cargar = useCallback(() => listarAgradecimientos(usuarioId), [usuarioId]);
  const { datos, cargando, error, recargar } = useListado(cargar);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Agradecimientos</Text>
      {cargando ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : error ? (
        <View style={styles.fila}>
          <Text style={styles.error}>No se pudieron cargar los agradecimientos.</Text>
          <Pressable onPress={recargar}>
            <Text style={styles.reintentar}>Reintentar</Text>
          </Pressable>
        </View>
      ) : datos.length === 0 ? (
        <Text style={styles.vacio}>Todavía no recibió agradecimientos.</Text>
      ) : (
        datos.map((a) => (
          <View key={a.id} style={styles.item}>
            <Text style={styles.mensaje}>"{a.mensaje}"</Text>
            <Text style={styles.autor}>
              {a.autorNombre} · {a.publicacionTitulo} · {formatearFecha(a.fecha)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 8 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  error: { color: COLORS.danger },
  reintentar: { color: COLORS.primary, fontWeight: 'bold' },
  vacio: { color: COLORS.muted },
  item: { borderLeftWidth: 3, borderColor: COLORS.primary, paddingLeft: 10, paddingVertical: 4 },
  mensaje: { color: COLORS.text, fontStyle: 'italic' },
  autor: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
});
