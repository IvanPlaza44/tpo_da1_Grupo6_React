import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../config';
import Badge from '../components/Badge';
import { listarAlertas } from '../services/alertas';
import { listarReclamosRecibidos } from '../services/reclamos';

const DESTINOS = [
  {
    clave: 'alertas',
    titulo: 'Mis alertas',
    detalle: 'Avisos cuando aparece algo que coincide con una búsqueda.',
    novedad: 'alertas',
  },
  {
    clave: 'seguidas',
    titulo: 'Seguidas',
    detalle: 'Publicaciones que estás mirando de cerca.',
    novedad: 'seguidas',
  },
  {
    clave: 'reclamos',
    titulo: 'Mis reclamos',
    detalle: 'Los que enviaste y los que recibiste.',
  },
  {
    clave: 'historial',
    titulo: 'Historial',
    detalle: 'Lo que devolviste y lo que recuperaste.',
  },
];

export default function ActividadScreen({ onIrA, novedades = {} }) {
  const [alertasNuevas, setAlertasNuevas] = useState([]);
  const [reclamosPendientes, setReclamosPendientes] = useState([]);

  useEffect(() => {
    let activo = true;
    Promise.allSettled([listarAlertas(), listarReclamosRecibidos()]).then(([alertas, reclamos]) => {
      if (!activo) return;
      if (alertas.status === 'fulfilled' && Array.isArray(alertas.value)) {
        setAlertasNuevas(alertas.value.filter((alerta) => alerta.activa && alerta.hayNovedades).slice(0, 3));
      }
      if (reclamos.status === 'fulfilled' && Array.isArray(reclamos.value)) {
        setReclamosPendientes(reclamos.value.filter((reclamo) => reclamo.estado === 'PENDIENTE').slice(0, 3));
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Text style={styles.titulo}>Actividad</Text>
      <Text style={styles.subtitulo}>Lo que necesita tu atención, y el resto de tus movimientos.</Text>

      {alertasNuevas.length > 0 ? (
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>Alertas con novedades</Text>
          {alertasNuevas.map((alerta) => (
            <Pressable key={alerta.id} style={styles.preview} onPress={() => onIrA?.('alertas')}>
              <Text style={styles.previewTitulo} numberOfLines={1}>{alerta.nombre}</Text>
              <Badge texto={alerta.cantidadNovedades > 0 ? String(alerta.cantidadNovedades) : null} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {reclamosPendientes.length > 0 ? (
        <View style={styles.bloque}>
          <Text style={styles.bloqueTitulo}>Reclamos pendientes</Text>
          {reclamosPendientes.map((reclamo) => (
            <Pressable key={reclamo.id} style={styles.preview} onPress={() => onIrA?.('reclamos')}>
              <Text style={styles.previewTitulo} numberOfLines={1}>
                {reclamo.publicacionTitulo || 'Reclamo recibido'}
              </Text>
              <Text style={styles.previewDetalle}>Pendiente</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.lista}>
        {DESTINOS.map((destino) => {
          const cantidad = destino.novedad ? novedades[destino.novedad] || 0 : 0;
          return (
            <Pressable key={destino.clave} style={styles.fila} onPress={() => onIrA?.(destino.clave)}>
              <View style={styles.textos}>
                <Text style={styles.filaTitulo}>{destino.titulo}</Text>
                <Text style={styles.filaDetalle}>{destino.detalle}</Text>
              </View>
              {cantidad > 0 ? <Badge texto={String(cantidad)} /> : <Text style={styles.flecha}>›</Text>}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACE.lg, paddingBottom: 40, gap: SPACE.md },
  titulo: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  subtitulo: { color: COLORS.muted, fontSize: 15, lineHeight: 21 },
  bloque: { gap: SPACE.sm },
  bloqueTitulo: { fontSize: 13, fontWeight: '800', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACE.lg,
  },
  previewTitulo: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  previewDetalle: { color: COLORS.warning, fontWeight: '700', fontSize: 12 },
  lista: { gap: SPACE.sm, marginTop: SPACE.sm },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
  },
  textos: { flex: 1, gap: 4 },
  filaTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  filaDetalle: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  flecha: { color: COLORS.muted, fontSize: 22, fontWeight: '400' },
});
