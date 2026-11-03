import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '../config';
import StatusBadge from './ui/StatusBadge';

function formatearFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function tiempoRestante(iso) {
  if (!iso) return null;
  const horas = Math.floor((new Date(iso) - Date.now()) / 3600000);
  if (horas < 0) return null;
  if (horas < 1) return 'Vence en menos de una hora';
  return `Vence en ${horas} h`;
}

// recibido: true si soy el publicador (veo la respuesta de verificación y puedo aceptar/rechazar).
// sinConexion: true si no hay internet (aceptar/rechazar quedan deshabilitados, Punto 6).
// onPuntoEncuentro: abre el punto de encuentro de un reclamo aceptado (Punto 8).
export default function TarjetaReclamo({
  reclamo,
  recibido,
  ocupada,
  sinConexion,
  onAceptar,
  onRechazar,
  onPress,
  onPuntoEncuentro,
}) {
  const pendiente = reclamo.estado === 'PENDIENTE';
  const aceptado = reclamo.estado === 'ACEPTADO';
  const esMio = reclamo.publicacionTipo === 'ENCONTRADO';
  const restante = pendiente ? tiempoRestante(reclamo.fechaVencimiento) : null;

  return (
    <Pressable style={styles.tarjeta} onPress={onPress} disabled={!onPress}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo} numberOfLines={1}>
          {reclamo.publicacionTitulo || `Publicación #${reclamo.publicacionId}`}
        </Text>
        <StatusBadge estado={reclamo.estado} />
      </View>

      <Text style={styles.detalle}>
        {esMio ? '"Es mío"' : '"Lo encontré"'}
        {recibido && reclamo.reclamanteNombre ? ` de ${reclamo.reclamanteNombre}` : ''}
        {` el ${formatearFecha(reclamo.fechaCreacion)}`}
      </Text>
      {restante ? <Text style={styles.vence}>{restante}</Text> : null}

      {recibido ? (
        <View style={styles.contenido}>
          {reclamo.respuestaVerificacion ? (
            <Text style={styles.linea}>
              <Text style={styles.etiqueta}>Respuesta a tu pregunta: </Text>
              {reclamo.respuestaVerificacion}
            </Text>
          ) : null}
          {reclamo.barrio ? (
            <Text style={styles.linea}>
              <Text style={styles.etiqueta}>Lo encontró en: </Text>
              {reclamo.barrio}
            </Text>
          ) : null}
          {reclamo.mensaje ? <Text style={styles.linea}>{reclamo.mensaje}</Text> : null}
          {reclamo.fotoUrl ? <Image source={{ uri: reclamo.fotoUrl }} style={styles.foto} /> : null}
        </View>
      ) : null}

      {recibido && pendiente ? (
        <View style={styles.acciones}>
          {ocupada ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : sinConexion ? (
            <Text style={styles.sinConexion}>Necesitás conexión para aceptar o rechazar.</Text>
          ) : (
            <>
              <Pressable style={[styles.boton, styles.botonRechazar]} onPress={onRechazar}>
                <Text style={styles.botonRechazarTexto}>Rechazar</Text>
              </Pressable>
              <Pressable style={[styles.boton, styles.botonAceptar]} onPress={onAceptar}>
                <Text style={styles.botonAceptarTexto}>Aceptar</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {aceptado && onPuntoEncuentro ? (
        <Pressable style={[styles.boton, styles.botonEncuentro]} onPress={onPuntoEncuentro}>
          <Text style={styles.botonAceptarTexto}>📍 Punto de encuentro</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { padding: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, gap: 6, marginBottom: 4 },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titulo: { flex: 1, fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  estado: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  estadoTexto: { fontSize: 12, fontWeight: '600' },
  detalle: { fontSize: 13, color: COLORS.muted },
  vence: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },
  contenido: { marginTop: 6, gap: 4 },
  linea: { fontSize: 14, color: COLORS.text },
  etiqueta: { fontWeight: '600' },
  foto: { width: '100%', height: 160, borderRadius: 8, marginTop: 4 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  sinConexion: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
  boton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999 },
  botonAceptar: { backgroundColor: COLORS.primary },
  botonAceptarTexto: { color: COLORS.white, fontWeight: '700' },
  botonRechazar: { backgroundColor: COLORS.dangerSoft },
  botonRechazarTexto: { color: COLORS.danger, fontWeight: '700' },
  botonEncuentro: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', marginTop: 8 },
});