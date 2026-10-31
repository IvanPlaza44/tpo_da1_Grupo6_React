import { FlatList, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { listarAlertas } from '../services/alertas';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';

export default function MisAlertasScreen() {
  const { datos, cargando, refrescando, error, recargar, refrescar } = useListado(listarAlertas);

  if (cargando) return <EstadoCargando mensaje="Cargando alertas…" />;
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
          titulo="No tenés alertas"
          mensaje="Guardá una búsqueda como alerta para enterarte cuando aparezca algo que coincida."
        />
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.nombre}>{item.nombre}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 8 },
  vacio: { flexGrow: 1 },
  item: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 12 },
  nombre: { fontSize: 16, color: COLORS.text },
});
