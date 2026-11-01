import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../config';
import { crearReclamo, obtenerPublicacionParaReclamo } from '../services/reclamos';
import { getErrorMessage } from '../services/api';
import { EstadoCargando, EstadoError } from '../components/EstadoPantalla';
import { useConexion } from '../hooks/useConexion';

// Formulario de reclamo (Punto 7).
// - Publicación ENCONTRADO → "Es mío": responder la pregunta de verificación; descripción y foto opcionales.
// - Publicación PERDIDO → "Lo encontré": foto y barrio obligatorios; descripción opcional.
// Sin conexión el envío queda deshabilitado (Punto 6).
// Props: publicacionId; onVolver(); onEnviado(reclamo). Los conecta quien abre la pantalla
// (por ejemplo, el detalle de la publicación del Punto 4).
export default function ReclamarScreen({ publicacionId, onVolver, onEnviado }) {
  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [respuesta, setRespuesta] = useState('');
  const [barrio, setBarrio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [foto, setFoto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const { conectado } = useConexion();

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      setPublicacion(await obtenerPublicacionParaReclamo(publicacionId));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [publicacionId]);

  if (cargando) return <EstadoCargando mensaje="Cargando publicación…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={cargar} />;

  const esMio = publicacion.tipo === 'ENCONTRADO';
  const hayPregunta = Boolean(publicacion.preguntaVerificacion);
  const bloqueo = motivoBloqueo(publicacion);

  const abrirSelector = async (desdeCamara) => {
    const permiso = desdeCamara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso requerido',
        desdeCamara
          ? 'Necesitamos acceso a la cámara para sacar la foto.'
          : 'Necesitamos acceso a tu galería para elegir la foto.'
      );
      return;
    }
    const opciones = { mediaTypes: ['images'], quality: 0.7 };
    const resultado = desdeCamara
      ? await ImagePicker.launchCameraAsync(opciones)
      : await ImagePicker.launchImageLibraryAsync(opciones);
    if (!resultado.canceled && resultado.assets?.length) {
      setFoto(resultado.assets[0]);
    }
  };

  const elegirFoto = () =>
    Alert.alert('Agregar foto', '¿De dónde querés sacar la foto?', [
      { text: 'Cámara', onPress: () => abrirSelector(true) },
      { text: 'Galería', onPress: () => abrirSelector(false) },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  const validar = () => {
    if (esMio && hayPregunta && !respuesta.trim()) return 'Respondé la pregunta de verificación.';
    if (!esMio && !foto) return 'Adjuntá una foto de lo que encontraste.';
    if (!esMio && !barrio.trim()) return 'Indicá el barrio donde lo encontraste.';
    return null;
  };

  const enviar = async () => {
    if (!conectado) {
      Alert.alert('Sin conexión', 'Necesitás internet para enviar el reclamo.');
      return;
    }
    const problema = validar();
    if (problema) {
      Alert.alert('Faltan datos', problema);
      return;
    }
    setEnviando(true);
    try {
      const reclamo = await crearReclamo(publicacion, {
        mensaje,
        respuestaVerificacion: esMio ? respuesta : null,
        barrio: esMio ? null : barrio,
        foto,
      });
      const detalle = reclamo.errorFoto
        ? 'El reclamo se envió, pero la foto no se pudo subir. Revisá tu conexión.'
        : esMio
          ? 'Quien lo encontró va a revisar tu respuesta. Tiene 48 horas para responder.'
          : 'El dueño va a revisar la foto para confirmar si es lo suyo. Tiene 48 horas para responder.';
      Alert.alert('Reclamo enviado', detalle, [{ text: 'OK', onPress: () => onEnviado?.(reclamo) }]);
    } catch (e) {
      Alert.alert('No se pudo enviar el reclamo', getErrorMessage(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {onVolver ? (
        <Pressable onPress={onVolver} style={styles.volver}>
          <Text style={styles.volverTexto}>‹ Volver</Text>
        </Pressable>
      ) : null}

      <Text style={styles.titulo}>{esMio ? 'Es mío' : 'Lo encontré'}</Text>
      <View style={styles.publicacion}>
        <Text style={styles.publicacionTipo}>{esMio ? 'Alguien encontró:' : 'Alguien perdió:'}</Text>
        <Text style={styles.publicacionTitulo}>{publicacion.titulo || `Publicación #${publicacion.id}`}</Text>
      </View>

      {bloqueo ? (
        <View style={styles.bloqueo}>
          <Text style={styles.bloqueoTexto}>{bloqueo}</Text>
        </View>
      ) : (
        <>
          {esMio && hayPregunta ? (
            <View style={styles.campo}>
              <Text style={styles.label}>Pregunta de verificación *</Text>
              <Text style={styles.pregunta}>{publicacion.preguntaVerificacion}</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu respuesta"
                value={respuesta}
                onChangeText={setRespuesta}
                maxLength={500}
              />
              <Text style={styles.ayuda}>Solo la ve quien publicó, para confirmar que es tuyo.</Text>
            </View>
          ) : null}

          {!esMio ? (
            <View style={styles.campo}>
              <Text style={styles.label}>Barrio donde lo encontraste *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Palermo, Caballito..."
                value={barrio}
                onChangeText={setBarrio}
                maxLength={255}
              />
            </View>
          ) : null}

          <View style={styles.campo}>
            <Text style={styles.label}>
              {esMio ? 'Foto que muestre que es tuyo (opcional)' : 'Foto de lo que encontraste *'}
            </Text>
            {foto ? (
              <View>
                <Image source={{ uri: foto.uri }} style={styles.foto} />
                <View style={styles.fotoAcciones}>
                  <Pressable onPress={elegirFoto}>
                    <Text style={styles.link}>Cambiar foto</Text>
                  </Pressable>
                  <Pressable onPress={() => setFoto(null)}>
                    <Text style={[styles.link, styles.linkPeligro]}>Quitar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.botonFoto} onPress={elegirFoto}>
                <Text style={styles.botonFotoTexto}>📷 Agregar foto</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.campo}>
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultilinea]}
              placeholder={
                esMio
                  ? 'Contá algún detalle que ayude a confirmar que es tuyo'
                  : 'Contá cómo y cuándo lo encontraste'
              }
              value={mensaje}
              onChangeText={setMensaje}
              multiline
              maxLength={1000}
            />
          </View>

          <Text style={styles.ayuda}>
            Podés hacer hasta 3 reclamos por publicación. Si no te responden en 48 horas, el reclamo vence.
          </Text>

          {!conectado ? (
            <View style={styles.bloqueo}>
              <Text style={styles.bloqueoTexto}>
                Sin conexión: necesitás internet para enviar el reclamo.
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.botonEnviar, (enviando || !conectado) && styles.botonDeshabilitado]}
            onPress={enviar}
            disabled={enviando || !conectado}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonEnviarTexto}>Enviar reclamo</Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

// Casos en los que no se puede reclamar (el backend también lo valida).
function motivoBloqueo(publicacion) {
  if (publicacion.esPropia) return 'Es tu propia publicación: no podés reclamarla.';
  if (publicacion.miReclamoEstado === 'ACEPTADO') return 'Tu reclamo sobre esta publicación ya fue aceptado.';
  if (publicacion.miReclamoEstado === 'PENDIENTE') {
    return 'Ya tenés un reclamo pendiente sobre esta publicación. Esperá la respuesta en "Mis reclamos".';
  }
  if (publicacion.estado !== 'ABIERTA' && publicacion.estado !== 'EN_RECLAMO') {
    return 'Esta publicación ya no recibe reclamos.';
  }
  return null;
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, backgroundColor: COLORS.background },
  volver: { alignSelf: 'flex-start', paddingVertical: 4 },
  volverTexto: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  publicacion: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#f9fafb', gap: 2 },
  publicacionTipo: { fontSize: 12, color: COLORS.muted },
  publicacionTitulo: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  bloqueo: { padding: 14, borderRadius: 10, backgroundColor: '#fef3c7' },
  bloqueoTexto: { color: '#92400e', fontSize: 14 },
  campo: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  pregunta: { fontSize: 15, color: COLORS.text, fontStyle: 'italic' },
  input: { minHeight: 46, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  inputMultilinea: { minHeight: 90, paddingTop: 10, textAlignVertical: 'top' },
  ayuda: { fontSize: 12, color: COLORS.muted },
  foto: { width: '100%', height: 200, borderRadius: 8 },
  fotoAcciones: { flexDirection: 'row', gap: 20, marginTop: 8 },
  link: { color: COLORS.primary, fontWeight: '600' },
  linkPeligro: { color: COLORS.danger },
  botonFoto: { paddingVertical: 18, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primary, alignItems: 'center' },
  botonFotoTexto: { color: COLORS.primary, fontWeight: '600' },
  botonEnviar: { marginTop: 4, marginBottom: 20, paddingVertical: 14, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center' },
  botonDeshabilitado: { opacity: 0.6 },
  botonEnviarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});