import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text } from 'react-native';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import Aviso from '../components/ui/Aviso';
import PublicationCard from '../components/ui/PublicationCard';
import { COLORS } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useConexion } from '../hooks/useConexion';
import { getErrorMessage } from '../services/api';
import { leerPendientes, quitarPendiente, suscribirCambios } from '../services/colaPendientes';
import {
  eliminarPublicacion,
  obtenerMisBorradores,
  obtenerMisPublicaciones,
  renovarPublicacion,
} from '../services/publicaciones';
import { conCache } from '../utils/cache';
import { CATEGORIAS } from '../utils/etiquetas';

// Convierte un elemento de la cola al mismo formato que usan las tarjetas.
const pendienteATarjeta = (p) => ({
  id: `local-${p.idLocal}`,
  idLocal: p.idLocal,
  esPendiente: true,
  titulo: p.datos.titulo,
  tipo: p.tipo,
  categoria: p.datos.categoria,
  barrio: p.datos.barrio,
  fotoPrincipal: p.fotos[0]?.uri || null,
  estado: 'PENDIENTE',
  error: p.error || null,
});

export default function MisPublicacionesScreen({ onAbrirPublicacion, onIrA }) {
  const { user } = useAuth();
  const { conectado } = useConexion();
  const [secciones, setSecciones] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const cantidadPrevia = useRef(0);

  const cargar = useCallback(async () => {
    try {
      setError(null);
      // La clave lleva el id del usuario para no mezclar cuentas en el mismo celular.
      const [borradores, publicadas] = await Promise.all([
        conCache(`mis-borradores:${user?.usuarioId}`, obtenerMisBorradores),
        conCache(`mis-publicaciones:${user?.usuarioId}`, obtenerMisPublicaciones),
      ]);
      setDesactualizado(borradores.desactualizado || publicadas.desactualizado);
      setSecciones([
        { titulo: 'Borradores', data: borradores.datos },
        { titulo: 'Publicadas', data: publicadas.datos },
      ]);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [user?.usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mantiene al día la sección de pendientes. Si la cola se achicó (se envió algo), recarga las listas.
  useEffect(() => {
    const leer = async () => {
      const lista = await leerPendientes(user?.usuarioId);
      if (lista.length < cantidadPrevia.current) cargar();
      cantidadPrevia.current = lista.length;
      setPendientes(lista);
    };
    leer();
    return suscribirCambios(leer);
  }, [user?.usuarioId, cargar]);

  const confirmarBorrado = (item) => {
    // Una pendiente solo existe en el celular: se descarta sin necesitar conexión.
    if (item.esPendiente) {
      return Alert.alert('Descartar', '¿Descartar esta publicación pendiente de envío?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => quitarPendiente(user.usuarioId, item.idLocal),
        },
      ]);
    }
    if (!conectado) {
      return Alert.alert('Sin conexión', 'Necesitás conexión a internet para eliminar una publicación.');
    }
    Alert.alert('Eliminar', `¿Eliminar "${item.titulo || 'borrador sin título'}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarPublicacion(item.id);
            cargar();
          } catch (e) {
            Alert.alert('Error', getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const renovar = async (item) => {
    if (!conectado) {
      return Alert.alert('Sin conexión', 'Necesitás conexión a internet para renovar una publicación.');
    }
    try {
      await renovarPublicacion(item.id);
      cargar();
      Alert.alert('Listo', 'Renovaste la publicación por 30 días más');
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    }
  };

  const abrir = (item) => {
    if (item.esPendiente) {
      return Alert.alert(
        'Pendiente de envío',
        item.error
          ? `El servidor la rechazó: ${item.error}\n\nMantené apretado para descartarla.`
          : 'Se va a publicar automáticamente cuando recuperes la conexión.'
      );
    }
    if (item.estado === 'BORRADOR') {
      return Alert.alert('Borrador', 'Retomalo desde la pestaña Publicar');
    }
    onAbrirPublicacion?.(item.id);
  };

  if (cargando && pendientes.length === 0) return <EstadoCargando />;
  if (error && pendientes.length === 0) return <EstadoError mensaje={error} onReintentar={cargar} />;

  const seccionesTodas = [
    { titulo: 'Pendientes de envío', data: pendientes.map(pendienteATarjeta) },
    ...secciones,
  ].filter((s) => s.data.length > 0);

  if (seccionesTodas.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no publicaste nada"
        mensaje="Cuando publiques algo, lo vas a ver acá."
        accionTexto="Publicar"
        onAccion={() => onIrA?.('publicar')}
      />
    );
  }

  return (
    <SectionList
      sections={seccionesTodas}
      keyExtractor={(item) => String(item.id)}
      refreshing={refrescando}
      onRefresh={() => {
        setRefrescando(true);
        cargar();
      }}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        desactualizado ? (
          <Aviso>Estás viendo datos guardados: pueden no estar actualizados.</Aviso>
        ) : null
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.seccion}>{section.titulo} ({section.data.length})</Text>
      )}
      renderItem={({ item }) => (
        <PublicationCard
          foto={item.fotoPrincipal}
          titulo={item.titulo}
          tipo={item.tipo}
          estado={item.estado}
          linea={`${CATEGORIAS[item.categoria] || 'Sin categoría'} · ${item.barrio || 'Sin barrio'}`}
          detalle={
            !item.esPendiente && item.estado !== 'BORRADOR' && item.fechaVencimiento
              ? `${item.estado === 'VENCIDA' ? 'Venció el ' : 'Vence el '}${new Date(item.fechaVencimiento).toLocaleDateString('es-AR')}`
              : null
          }
          onPress={() => abrir(item)}
          onLongPress={() => confirmarBorrado(item)}
        >
          {item.error ? <Text style={styles.error}>Rechazada: {item.error}</Text> : null}
          {(item.estado === 'ABIERTA' || item.estado === 'VENCIDA') && (
            <Pressable onPress={() => renovar(item)}>
              <Text style={styles.renovar}>Renovar por 30 días</Text>
            </Pressable>
          )}
        </PublicationCard>
      )}
      ListFooterComponent={<Text style={styles.ayuda}>Mantené apretado para eliminar.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, paddingBottom: 32 },
  seccion: { fontSize: 15, fontWeight: '700', color: COLORS.muted, marginTop: 8, marginBottom: 4 },
  error: { color: COLORS.danger, fontSize: 12 },
  renovar: { color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  ayuda: { color: COLORS.muted, textAlign: 'center', marginTop: 16, fontSize: 12 },
});
