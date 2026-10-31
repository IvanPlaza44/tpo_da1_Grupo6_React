import { useState } from 'react';
import { Alert, FlatList, StyleSheet } from 'react-native';
import { eliminarAlerta, listarAlertas, pausarAlerta, reactivarAlerta } from '../services/alertas';
import { getErrorMessage } from '../services/api';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import TarjetaAlerta from '../components/TarjetaAlerta';

export default function MisAlertasScreen() {
  const { datos, setDatos, cargando, refrescando, error, recargar, refrescar } = useListado(listarAlertas);
  const [ocupadas, setOcupadas] = useState(new Set());

  const conOcupada = async (id, accion) => {
    setOcupadas((prev) => new Set(prev).add(id));
    try {
      await accion();
    } catch (e) {
      Alert.alert('No se pudo completar la acción', getErrorMessage(e));
    } finally {
      setOcupadas((prev) => {
        const siguiente = new Set(prev);
        siguiente.delete(id);
        return siguiente;
      });
    }
  };

  const alternarPausa = (alerta) =>
    conOcupada(alerta.id, async () => {
      await (alerta.activa ? pausarAlerta(alerta.id) : reactivarAlerta(alerta.id));
      setDatos((prev) => prev.map((a) => (a.id === alerta.id ? { ...a, activa: !alerta.activa } : a)));
    });

  const confirmarEliminar = (alerta) =>
    Alert.alert('Eliminar alerta', `¿Eliminar "${alerta.nombre}"? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          conOcupada(alerta.id, async () => {
            await eliminarAlerta(alerta.id);
            setDatos((prev) => prev.filter((a) => a.id !== alerta.id));
          }),
      },
    ]);

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
        <TarjetaAlerta
          alerta={item}
          ocupada={ocupadas.has(item.id)}
          onAlternarPausa={() => alternarPausa(item)}
          onEliminar={() => confirmarEliminar(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 8 },
  vacio: { flexGrow: 1 },
});
