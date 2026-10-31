import { FlatList, StyleSheet } from 'react-native';
import { listarSeguidas, marcarSeguidaVista } from '../services/seguidas';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import TarjetaSeguida from '../components/TarjetaSeguida';

// onAbrirPublicacion(id): lo conecta la navegación para ir al detalle de la publicación.
// onNovedadesVistas(): avisa que cambiaron las novedades (para refrescar el badge de la pestaña).
export default function SeguidasScreen({ onAbrirPublicacion, onNovedadesVistas }) {
  const { datos, setDatos, cargando, refrescando, error, recargar, refrescar } = useListado(listarSeguidas);

  const ponerCambio = (id, cambioEstado) =>
    setDatos((prev) => prev.map((p) => (p.id === id ? { ...p, cambioEstado } : p)));

  const abrir = async (publicacion) => {
    onAbrirPublicacion?.(publicacion.id);
    if (!publicacion.cambioEstado) return;
    ponerCambio(publicacion.id, false);
    try {
      await marcarSeguidaVista(publicacion.id);
      onNovedadesVistas?.();
    } catch {
      ponerCambio(publicacion.id, true);
    }
  };

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
      renderItem={({ item }) => <TarjetaSeguida publicacion={item} onPress={() => abrir(item)} />}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 8 },
  vacio: { flexGrow: 1 },
});
