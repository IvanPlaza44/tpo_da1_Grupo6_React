import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import {
  aceptarReclamo,
  listarReclamosEnviados,
  listarReclamosRecibidos,
  rechazarReclamo,
} from '../services/reclamos';
import { getErrorMessage } from '../services/api';
import useListado from '../hooks/useListado';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import TarjetaReclamo from '../components/TarjetaReclamo';

const PESTANIAS = [
  {
    clave: 'ENVIADOS',
    titulo: 'Enviados',
    cargar: listarReclamosEnviados,
    vacio: 'No enviaste reclamos',
    vacioMensaje: 'Cuando digas "Es mío" o "Lo encontré" en una publicación, lo vas a ver acá.',
  },
  {
    clave: 'RECIBIDOS',
    titulo: 'Recibidos',
    cargar: listarReclamosRecibidos,
    vacio: 'No recibiste reclamos',
    vacioMensaje: 'Cuando alguien reclame una de tus publicaciones, lo vas a ver acá.',
  },
];

// "Siempre actualizados": la lista se carga cada vez que se entra a la pantalla
// (App.js la vuelve a montar al cambiar de pestaña) y se puede refrescar deslizando hacia abajo.
// onAbrirPublicacion(id): lo conecta la navegación para ir al detalle de la publicación.
export default function MisReclamosScreen({ onAbrirPublicacion }) {
  const [clave, setClave] = useState(PESTANIAS[0].clave);
  const pestania = PESTANIAS.find((p) => p.clave === clave);

  return (
    <View style={styles.container}>
      <View style={styles.selector}>
        {PESTANIAS.map((p) => (
          <Pressable
            key={p.clave}
            style={[styles.opcion, p.clave === clave && styles.opcionActiva]}
            onPress={() => setClave(p.clave)}
          >
            <Text style={[styles.opcionTexto, p.clave === clave && styles.opcionTextoActiva]}>{p.titulo}</Text>
          </Pressable>
        ))}
      </View>
      <ListaReclamos key={clave} pestania={pestania} onAbrirPublicacion={onAbrirPublicacion} />
    </View>
  );
}

function ListaReclamos({ pestania, onAbrirPublicacion }) {
  const recibidos = pestania.clave === 'RECIBIDOS';
  const { datos, setDatos, cargando, refrescando, error, recargar, refrescar } = useListado(pestania.cargar);
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

  // Aceptar uno rechaza automáticamente los demás pendientes de la misma publicación,
  // así que después de aceptar recargamos la lista entera.
  const confirmarAceptar = (reclamo) =>
    Alert.alert(
      'Aceptar reclamo',
      'Vas a compartir la dirección exacta con esta persona y se rechazarán los demás reclamos pendientes de esta publicación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: () =>
            conOcupada(reclamo.id, async () => {
              await aceptarReclamo(reclamo.publicacionId, reclamo.id);
              await refrescar();
            }),
        },
      ]
    );

  const confirmarRechazar = (reclamo) =>
    Alert.alert('Rechazar reclamo', '¿Seguro que querés rechazar este reclamo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: () =>
          conOcupada(reclamo.id, async () => {
            await rechazarReclamo(reclamo.publicacionId, reclamo.id);
            setDatos((prev) => prev.map((r) => (r.id === reclamo.id ? { ...r, estado: 'RECHAZADO' } : r)));
          }),
      },
    ]);

  if (cargando) return <EstadoCargando mensaje="Cargando reclamos…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  return (
    <FlatList
      data={datos}
      keyExtractor={(item) => String(item.id)}
      refreshing={refrescando}
      onRefresh={refrescar}
      contentContainerStyle={datos.length === 0 ? styles.vacio : styles.lista}
      ListEmptyComponent={<EstadoVacio titulo={pestania.vacio} mensaje={pestania.vacioMensaje} />}
      renderItem={({ item }) => (
        <TarjetaReclamo
          reclamo={item}
          recibido={recibidos}
          ocupada={ocupadas.has(item.id)}
          onAceptar={() => confirmarAceptar(item)}
          onRechazar={() => confirmarRechazar(item)}
          onPress={onAbrirPublicacion ? () => onAbrirPublicacion(item.publicacionId) : undefined}
        />
      )}
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