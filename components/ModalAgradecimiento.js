import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../config';
import { agradecer } from '../services/valoraciones';
import { getErrorMessage } from '../services/api';

const LARGO_MENSAJE = 300;

// Agradecimiento público a quien devolvió el objeto. caso = null oculta el modal.
// onAgradecido(agradecimiento) recibe { mensaje }.
export default function ModalAgradecimiento({ caso, onCerrar, onAgradecido }) {
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caso) {
      setMensaje('');
      setError(null);
    }
  }, [caso]);

  const enviar = async () => {
    if (!mensaje.trim()) {
      setError('Escribí un mensaje de agradecimiento');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await agradecer({ publicacionId: caso.publicacionId, mensaje });
      onAgradecido({ mensaje: mensaje.trim() });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => {
    if (!enviando) onCerrar();
  };

  return (
    <Modal visible={Boolean(caso)} transparent animationType="fade" onRequestClose={cerrar}>
      <View style={styles.fondo}>
        <View style={styles.dialogo}>
          <Text style={styles.titulo}>Agradecer a {caso?.contraparte.nombre}</Text>
          <Text style={styles.texto}>Tu mensaje va a ser público y se va a ver en su perfil.</Text>
          <TextInput
            style={styles.input}
            value={mensaje}
            onChangeText={setMensaje}
            placeholder={`Ej: ¡Gracias por devolverme ${caso?.titulo ?? 'mis cosas'}!`}
            maxLength={LARGO_MENSAJE}
            multiline
            editable={!enviando}
          />
          <Text style={styles.contador}>
            {mensaje.length}/{LARGO_MENSAJE}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.acciones}>
            <Pressable style={styles.accion} disabled={enviando} onPress={cerrar}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.accion, styles.confirmar]} disabled={enviando} onPress={enviar}>
              {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmarTexto}>Publicar</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialogo: { backgroundColor: COLORS.background, borderRadius: 8, padding: 16, gap: 8 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  texto: { color: COLORS.muted },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    minHeight: 90,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  contador: { alignSelf: 'flex-end', color: COLORS.muted, fontSize: 12 },
  error: { color: COLORS.danger },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  accion: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, minWidth: 90, alignItems: 'center' },
  confirmar: { backgroundColor: COLORS.primary },
  confirmarTexto: { color: '#fff' },
  cancelar: { color: COLORS.muted },
});
