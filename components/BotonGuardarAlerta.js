import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../config';
import { crearAlerta } from '../services/alertas';
import { getErrorMessage } from '../services/api';
import { CATEGORIAS } from '../utils/etiquetas';

const nombreSugerido = ({ tipo, categoria, palabrasClave, barrio }) => {
  const que = palabrasClave || CATEGORIAS[categoria] || 'Búsqueda';
  const accion = tipo === 'PERDIDO' ? 'perdido' : tipo === 'ENCONTRADO' ? 'encontrado' : null;
  return [que, accion, barrio && `en ${barrio}`].filter(Boolean).join(' ');
};

// Guarda los criterios de una búsqueda como alerta.
// criterios: los mismos filtros que usa el buscador
// { tipo, categoria, palabrasClave, barrio, rango | rangoFecha, fechaDesde, fechaHasta }.
export default function BotonGuardarAlerta({ criterios, onGuardada }) {
  const [visible, setVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [guardada, setGuardada] = useState(false);

  const abrir = () => {
    setNombre(nombreSugerido(criterios));
    setError(null);
    setVisible(true);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('Poné un nombre para la alerta');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const { rango, ...resto } = criterios;
      const alerta = await crearAlerta({
        ...resto,
        rangoFecha: criterios.rangoFecha ?? rango ?? null,
        nombre: nombre.trim(),
      });
      setGuardada(true);
      setVisible(false);
      onGuardada?.(alerta);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Pressable
        style={[styles.boton, guardada && styles.botonGuardada]}
        disabled={guardada}
        onPress={abrir}
      >
        <Text style={[styles.botonTexto, guardada && styles.botonTextoGuardada]}>
          {guardada ? 'Alerta guardada' : 'Guardar como alerta'}
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.fondo}>
          <View style={styles.dialogo}>
            <Text style={styles.titulo}>Guardar como alerta</Text>
            <Text style={styles.texto}>Te avisamos cuando aparezca una publicación que coincida.</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la alerta"
              maxLength={60}
              editable={!guardando}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.acciones}>
              <Pressable style={styles.accion} disabled={guardando} onPress={() => setVisible(false)}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.accion, styles.confirmar]} disabled={guardando} onPress={guardar}>
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botonTexto}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  boton: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center' },
  botonGuardada: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  botonTexto: { color: '#fff' },
  botonTextoGuardada: { color: COLORS.muted },
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialogo: { backgroundColor: COLORS.background, borderRadius: 8, padding: 16, gap: 8 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  texto: { color: COLORS.muted },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 10, color: COLORS.text },
  error: { color: COLORS.danger },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  accion: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, minWidth: 90, alignItems: 'center' },
  confirmar: { backgroundColor: COLORS.primary },
  cancelar: { color: COLORS.muted },
});
