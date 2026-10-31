import { FlatList, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { listarSeguidas } from '../services/seguidas';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';

export default function SeguidasScreen() {
  const { datos, cargando, refrescando, error, recargar, refrescar } = useListado(listarSeguidas);

  if (cargando) return <EstadoCargando mensaje="Cargando publicaciones seguidas…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  return (
    <FlatList
      data={datos}
      keyExtractor={(item) => String(item.id)}
      refreshing={refrescando}
      onRefresh={refrescar}
      contentContainerStyle={datos.length === 0 ? styles.vacio : styles.lista}
      ListEmptyComponent={
        <EstadoVacio
          titulo="No seguís ninguna publicación"
          mensaje="Desde el detalle de una publicación podés seguirla para enterarte de sus novedades."
        />
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.titulo}>{item.titulo}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 8 },
  vacio: { flexGrow: 1 },
  item: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12 },
  titulo: { fontSize: 16, color: COLORS.text },
});
