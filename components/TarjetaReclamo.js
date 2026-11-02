import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';

const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente', color: '#b45309', fondo: '#fef3c7' },
  ACEPTADO: { texto: 'Aceptado', color: '#15803d', fondo: '#dcfce7' },
  RECHAZADO: { texto: 'Rechazado', color: COLORS.danger, fondo: '#fee2e2' },
  VENCIDO: { texto: 'Vencido', color: COLORS.muted, fondo: '#f3f4f6' },
};

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
  const estado = ESTADOS[reclamo.estado] || ESTADOS.PENDIENTE;
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
        <View style={[styles.estado, { backgroundColor: estado.fondo }]}>
          <Text style={[styles.estadoTexto, { color: estado.color }]}>{estado.texto}</Text>
        </View>
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
  tarjeta: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff', gap: 4 },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titulo: { flex: 1, fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  estado: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  estadoTexto: { fontSize: 12, fontWeight: '600' },
  detalle: { fontSize: 13, color: COLORS.muted },
  vence: { fontSize: 12, color: '#b45309' },
  contenido: { marginTop: 6, gap: 4 },
  linea: { fontSize: 14, color: COLORS.text },
  etiqueta: { fontWeight: '600' },
  foto: { width: '100%', height: 160, borderRadius: 8, marginTop: 4 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  sinConexion: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
  boton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  botonAceptar: { backgroundColor: COLORS.primary },
  botonAceptarTexto: { color: '#fff', fontWeight: '600' },
  botonRechazar: { borderWidth: 1, borderColor: COLORS.danger },
  botonRechazarTexto: { color: COLORS.danger, fontWeight: '600' },
  botonEncuentro: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', marginTop: 8 },
});