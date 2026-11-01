import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ChipSelector from '../components/ChipSelector';
import { COLORS } from '../config';
import { getErrorMessage } from '../services/api';
import { actualizarPublicacion, crearPublicacion } from '../services/publicaciones';
import { CATEGORIAS, TIPOS } from '../utils/etiquetas';

// Convierte un objeto { CLAVE: 'Texto' } en [{ valor, label }] para el ChipSelector.
const aOpciones = (obj) => Object.entries(obj).map(([valor, label]) => ({ valor, label }));

const TOTAL_PASOS = 2; // se amplía en las próximas tandas

export default function PublicarScreen() {
  const [paso, setPaso] = useState(1);
  const [publicacionId, setPublicacionId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    tipo: null,
    categoria: null,
    titulo: '',
    descripcion: '',
  });

  // Actualiza un campo sin perder los demás.
  const cambiar = (campo, valor) => setForm((anterior) => ({ ...anterior, [campo]: valor }));

  const siguiente = async () => {
    try {
      setGuardando(true);
      if (paso === 1) {
        if (!form.tipo) return Alert.alert('Falta algo', 'Elegí si perdiste o encontraste algo');
        // Primera vez: se crea en el servidor. Si ya existía (volvió atrás), solo se actualiza.
        const creada = publicacionId
          ? await actualizarPublicacion(publicacionId, { tipo: form.tipo })
          : await crearPublicacion({ tipo: form.tipo });
        setPublicacionId(creada.id);
      }
      if (paso === 2) {
        if (!form.categoria || !form.titulo.trim()) {
          return Alert.alert('Falta algo', 'Elegí una categoría y escribí un título');
        }
        await actualizarPublicacion(publicacionId, {
          categoria: form.categoria,
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
        });
      }
      setPaso((p) => Math.min(p + 1, TOTAL_PASOS + 1));
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  if (paso > TOTAL_PASOS) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Borrador #{publicacionId} guardado</Text>
        <Text style={styles.ayuda}>Los siguientes pasos los agregamos en la próxima tanda.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.progreso}>Paso {paso} de {TOTAL_PASOS}</Text>

      {paso === 1 && (
        <>
          <Text style={styles.titulo}>¿Qué pasó?</Text>
          <ChipSelector opciones={aOpciones(TIPOS)} valor={form.tipo} onChange={(v) => cambiar('tipo', v)} />
        </>
      )}

      {paso === 2 && (
        <>
          <Text style={styles.titulo}>¿Qué es?</Text>
          <ChipSelector opciones={aOpciones(CATEGORIAS)} valor={form.categoria} onChange={(v) => cambiar('categoria', v)} />
          <Text style={styles.etiqueta}>Título</Text>
          <TextInput
            style={styles.input}
            value={form.titulo}
            onChangeText={(t) => cambiar('titulo', t)}
            placeholder="Ej: Llaves con llavero rojo"
            maxLength={100}
          />
          <Text style={styles.etiqueta}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.inputGrande]}
            value={form.descripcion}
            onChangeText={(t) => cambiar('descripcion', t)}
            placeholder="Detalles que ayuden a identificarlo"
            multiline
          />
        </>
      )}

      <View style={styles.botones}>
        {paso > 1 && (
          <Pressable style={[styles.boton, styles.botonSecundario]} onPress={() => setPaso(paso - 1)}>
            <Text style={styles.botonSecundarioTexto}>Atrás</Text>
          </Pressable>
        )}
        <Pressable style={[styles.boton, guardando && styles.botonInactivo]} onPress={siguiente} disabled={guardando}>
          <Text style={styles.botonTexto}>{guardando ? 'Guardando…' : 'Siguiente'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  progreso: { color: COLORS.muted },
  titulo: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  ayuda: { color: COLORS.muted, textAlign: 'center' },
  etiqueta: { color: COLORS.text, fontWeight: '600', marginTop: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, color: COLORS.text },
  inputGrande: { minHeight: 90, textAlignVertical: 'top' },
  botones: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boton: { flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  botonInactivo: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
  botonSecundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  botonSecundarioTexto: { color: COLORS.text },
});