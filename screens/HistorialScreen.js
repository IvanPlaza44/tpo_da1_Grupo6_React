import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { listarHistorial } from '../services/historial';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import TarjetaCaso from '../components/TarjetaCaso';
import FiltrosHistorial, { FILTROS_VACIOS, hayFiltros } from '../components/FiltrosHistorial';

const PESTANIAS = [
  {
    rol: 'DEVOLVI',
    titulo: 'Devolví',
    vacio: 'Todavía no devolviste nada',
    vacioMensaje: 'Cuando le devuelvas algo a su dueño, aparece acá.',
  },
  {
    rol: 'RECUPERE',
    titulo: 'Recuperé',
    vacio: 'Todavía no recuperaste nada',
    vacioMensaje: 'Cuando alguien te devuelva algo tuyo, aparece acá.',
  },
];

// onAbrirPerfil(usuarioId): lo conecta la navegación para ir al perfil público de la contraparte.
export default function HistorialScreen({ onAbrirPerfil }) {
  const [rol, setRol] = useState(PESTANIAS[0].rol);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const pestania = PESTANIAS.find((p) => p.rol === rol);

  return (
    <View style={styles.container}>
      <View style={styles.selector}>
        {PESTANIAS.map((p) => (
          <Pressable
            key={p.rol}
            style={[styles.opcion, p.rol === rol && styles.opcionActiva]}
            onPress={() => setRol(p.rol)}
          >
            <Text style={[styles.opcionTexto, p.rol === rol && styles.opcionTextoActiva]}>{p.titulo}</Text>
          </Pressable>
        ))}
      </View>
      <FiltrosHistorial filtros={filtros} onCambiar={setFiltros} />
      <ListaCasos key={rol} pestania={pestania} filtros={filtros} onAbrirPerfil={onAbrirPerfil} />
    </View>
  );
}

function ListaCasos({ pestania, filtros, onAbrirPerfil }) {
  const { desde, hasta, tipo } = filtros;
  const cargar = useCallback(
    () => listarHistorial({ rol: pestania.rol, desde, hasta, tipo }),
    [pestania.rol, desde, hasta, tipo]
  );
  const { datos, cargando, refrescando, error, recargar, refrescar } = useListado(cargar);
  const filtrado = hayFiltros(filtros);

  if (cargando) return <EstadoCargando mensaje="Cargando historial…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  return (
    <FlatList
      data={datos}
      keyExtractor={(item) => String(item.publicacionId)}
      refreshing={refrescando}
      onRefresh={refrescar}
      contentContainerStyle={datos.length === 0 ? styles.vacio : styles.lista}
      ListEmptyComponent={
        filtrado ? (
          <EstadoVacio titulo="No hay casos con estos filtros" mensaje="Probá con otro rango de fechas o tipo." />
        ) : (
          <EstadoVacio titulo={pestania.vacio} mensaje={pestania.vacioMensaje} />
        )
      }
      renderItem={({ item }) => <TarjetaCaso caso={item} onAbrirPerfil={onAbrirPerfil} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  selector: { flexDirection: 'row', margin: 16, marginBottom: 0, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 6, overflow: 'hidden' },
  opcion: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  opcionActiva: { backgroundColor: COLORS.primary },
  opcionTexto: { color: COLORS.primary },
  opcionTextoActiva: { color: '#fff', fontWeight: 'bold' },
  lista: { padding: 16, gap: 8 },
  vacio: { flexGrow: 1 },
});
