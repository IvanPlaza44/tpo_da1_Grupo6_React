import { FlatList, StyleSheet } from 'react-native';
import { listarSeguidas } from '../services/seguidas';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import TarjetaSeguida from '../components/TarjetaSeguida';

// onAbrirPublicacion(id): lo conecta la navegación para ir al detalle de la publicación.
export default function SeguidasScreen({ onAbrirPublicacion }) {
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
        <TarjetaSeguida publicacion={item} onPress={() => onAbrirPublicacion?.(item.id)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 8 },
  vacio: { flexGrow: 1 },
});
