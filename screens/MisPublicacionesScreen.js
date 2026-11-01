import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { EstadoCargando, EstadoError, EstadoVacio } from '../components/EstadoPantalla';
import { COLORS } from '../config';
import { getErrorMessage } from '../services/api';
import {
  eliminarPublicacion,
  obtenerMisBorradores,
  obtenerMisPublicaciones,
} from '../services/publicaciones';
import { CATEGORIAS, TIPOS } from '../utils/etiquetas';

const ETIQUETA_ESTADO = {
  BORRADOR: 'Borrador',
  ABIERTA: 'Abierta',
  EN_RECLAMO: 'En reclamo',
  RESUELTA: 'Resuelta',
};

export default function MisPublicacionesScreen({ onAbrirPublicacion }) {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setError(null);
      // Las dos llamadas salen a la vez (en paralelo) y esperamos a que terminen ambas.
      const [borradores, publicadas] = await Promise.all([
        obtenerMisBorradores(),
        obtenerMisPublicaciones(),
      ]);
      setSecciones([
        { titulo: 'Borradores', data: borradores },
        { titulo: 'Publicadas', data: publicadas },
      ]);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const confirmarBorrado = (item) => {
    Alert.alert('Eliminar', `¿Eliminar "${item.titulo || 'borrador sin título'}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarPublicacion(item.id);
            cargar(); // vuelve a pedir las listas actualizadas
          } catch (e) {
            Alert.alert('Error', getErrorMessage(e));
          }
        },
      },
    ]);
  };

  if (cargando) return <EstadoCargando />;
  if (error) return <EstadoError mensaje={error} onReintentar={cargar} />;

  const total = secciones.reduce((suma, s) => suma + s.data.length, 0);
  if (total === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no publicaste nada"
        mensaje="Cuando publiques algo, lo vas a ver acá."
      />
    );
  }

  return (
    <SectionList
      sections={secciones.filter((s) => s.data.length > 0)}
      keyExtractor={(item) => String(item.id)}
      refreshing={refrescando}
      onRefresh={() => {
        setRefrescando(true);
        cargar();
      }}
      contentContainerStyle={styles.lista}
      renderSectionHeader={({ section }) => (
        <Text style={styles.seccion}>{section.titulo} ({section.data.length})</Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          style={styles.tarjeta}
          onPress={() => item.estado !== 'BORRADOR' && onAbrirPublicacion?.(item.id)}
          onLongPress={() => confirmarBorrado(item)}
        >
          {item.fotoPrincipal ? (
            <Image source={{ uri: item.fotoPrincipal }} style={styles.foto} />
          ) : (
            <View style={[styles.foto, styles.sinFoto]}>
              <Text style={styles.sinFotoTexto}>Sin foto</Text>
            </View>
          )}
          <View style={styles.datos}>
            <Text style={styles.titulo} numberOfLines={2}>
              {item.titulo || 'Sin título'}
            </Text>
            <Text style={styles.detalle}>
              {TIPOS[item.tipo]} · {CATEGORIAS[item.categoria] || 'Sin categoría'}
            </Text>
            <Text style={styles.detalle}>{item.barrio || 'Sin barrio'}</Text>
            <Text style={[styles.estado, item.estado === 'BORRADOR' && styles.estadoBorrador]}>
              {ETIQUETA_ESTADO[item.estado] || item.estado}
            </Text>
          </View>
        </Pressable>
      )}
      ListFooterComponent={<Text style={styles.ayuda}>Mantené apretado para eliminar.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 10 },
  seccion: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 8, backgroundColor: COLORS.background },
  tarjeta: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, marginTop: 8 },
  foto: { width: 80, height: 80, borderRadius: 8 },
  sinFoto: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  sinFotoTexto: { color: COLORS.muted, fontSize: 12 },
  datos: { flex: 1, gap: 2 },
  titulo: { fontWeight: 'bold', color: COLORS.text },
  detalle: { color: COLORS.muted, fontSize: 13 },
  estado: { color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  estadoBorrador: { color: '#d97706' },
  ayuda: { color: COLORS.muted, textAlign: 'center', marginTop: 16, fontSize: 12 },
});