import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../config';
import { valorar } from '../services/valoraciones';
import { getErrorMessage } from '../services/api';

const LARGO_COMENTARIO = 200;

// Valorar a la contraparte de un caso del historial. caso = null oculta el modal.
// onValorado(valoracion) recibe { positiva, comentario }.
export default function ModalValoracion({ caso, onCerrar, onValorado }) {
  const [positiva, setPositiva] = useState(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caso) {
      setPositiva(null);
      setComentario('');
      setError(null);
    }
  }, [caso]);

  const enviar = async () => {
    if (positiva === null) {
      setError('Elegí si la valoración es positiva o negativa');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await valorar({ publicacionId: caso.publicacionId, positiva, comentario });
      onValorado({ positiva, comentario: comentario.trim() || null });
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
          <Text style={styles.titulo}>Valorar a {caso?.contraparte.nombre}</Text>
          <Text style={styles.texto}>¿Cómo fue la devolución de "{caso?.titulo}"?</Text>
          <View style={styles.opciones}>
            {[
              [true, 'Positiva', styles.opcionPositiva],
              [false, 'Negativa', styles.opcionNegativa],
            ].map(([valor, texto, estiloActivo]) => (
              <Pressable
                key={texto}
                style={[styles.opcion, positiva === valor && estiloActivo]}
                disabled={enviando}
                onPress={() => setPositiva(valor)}
              >
                <Text style={[styles.opcionTexto, positiva === valor && styles.opcionTextoActiva]}>{texto}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={comentario}
            onChangeText={setComentario}
            placeholder="Mensaje breve (opcional)"
            maxLength={LARGO_COMENTARIO}
            multiline
            editable={!enviando}
          />
          <Text style={styles.contador}>
            {comentario.length}/{LARGO_COMENTARIO}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.acciones}>
            <Pressable style={styles.accion} disabled={enviando} onPress={cerrar}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.accion, styles.confirmar]} disabled={enviando} onPress={enviar}>
              {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmarTexto}>Enviar</Text>}
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
  opciones: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  opcion: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
  opcionPositiva: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  opcionNegativa: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  opcionTexto: { color: COLORS.text },
  opcionTextoActiva: { color: '#fff', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    minHeight: 70,
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
