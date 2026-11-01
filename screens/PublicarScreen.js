import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import ChipSelector from '../components/ChipSelector';
import SelectorFotos from '../components/SelectorFotos';
import { COLORS } from '../config';
import { getErrorMessage } from '../services/api';
import {
  actualizarPublicacion,
  crearPublicacion,
  publicarPublicacion,
  subirFoto,
} from '../services/publicaciones';
import { CATEGORIAS, TIPOS } from '../utils/etiquetas';
import { aFechaISO } from '../utils/fechaLocal';
import { FRANJAS, aOpciones } from '../utils/publicarOpciones';

const TOTAL_PASOS = 4;

const FORM_INICIAL = {
  tipo: null,
  categoria: null,
  titulo: '',
  descripcion: '',
  fechaSuceso: new Date(),
  franjaHoraria: null,
  barrio: '',
  direccionExacta: '',
  latitud: null,
  longitud: null,
};

export default function PublicarScreen() {
  const [paso, setPaso] = useState(1);
  const [publicacionId, setPublicacionId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ ...FORM_INICIAL, fechaSuceso: new Date() });
  const [fotos, setFotos] = useState([]);
  const [fotosSubidas, setFotosSubidas] = useState([]); // uris ya subidas, para no repetir si reintenta
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

  // Actualiza un campo sin perder los demás.
  const cambiar = (campo, valor) => setForm((anterior) => ({ ...anterior, [campo]: valor }));

  // Vuelve todo al estado inicial para cargar otra publicación.
  const reiniciar = () => {
    setPaso(1);
    setPublicacionId(null);
    setFotos([]);
    setFotosSubidas([]);
    setForm({ ...FORM_INICIAL, fechaSuceso: new Date() });
  };

  // Pide permiso y lee las coordenadas actuales del celular.
  const usarMiUbicacion = async () => {
    try {
      setBuscandoUbicacion(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permiso denegado', 'Sin ubicación podés escribir el barrio a mano');
      }
      const pos = await Location.getCurrentPositionAsync({});
      setForm((f) => ({ ...f, latitud: pos.coords.latitude, longitud: pos.coords.longitude }));
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setBuscandoUbicacion(false);
    }
  };

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

      if (paso === 3) {
        if (!form.barrio.trim()) {
          return Alert.alert('Falta algo', 'Indicá el barrio donde ocurrió');
        }
        if (form.fechaSuceso > new Date()) {
          return Alert.alert('Fecha inválida', 'La fecha no puede ser futura');
        }
        await actualizarPublicacion(publicacionId, {
          fechaSuceso: aFechaISO(form.fechaSuceso),
          franjaHoraria: form.franjaHoraria,
          barrio: form.barrio.trim(),
          direccionExacta: form.direccionExacta.trim() || null,
          latitud: form.latitud,
          longitud: form.longitud,
        });
      }

      if (paso === 4) {
        if (fotos.length === 0) {
          return Alert.alert('Falta algo', 'Agregá al menos una foto');
        }
        // Sube solo las que todavía no se subieron (si falló a la mitad, reintenta sin duplicar)
        for (const foto of fotos) {
          if (!fotosSubidas.includes(foto.uri)) {
            await subirFoto(publicacionId, foto);
            setFotosSubidas((prev) => [...prev, foto.uri]);
          }
        }
        await publicarPublicacion(publicacionId);
      }

      setPaso((p) => Math.min(p + 1, TOTAL_PASOS + 1));
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  // Pantalla final: ya se publicó.
  if (paso > TOTAL_PASOS) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>¡Publicación #{publicacionId} publicada!</Text>
        <Text style={styles.ayuda}>Ya la pueden ver otros usuarios en el buscador.</Text>
        <Pressable
          style={[styles.boton, { flex: 0, alignSelf: 'stretch', marginTop: 12 }]}
          onPress={reiniciar}
        >
          <Text style={styles.botonTexto}>Publicar otra</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.progreso}>Paso {paso} de {TOTAL_PASOS}</Text>

      {paso === 1 && (
        <>
          <Text style={styles.titulo}>¿Qué pasó?</Text>
          <ChipSelector
            opciones={aOpciones(TIPOS)}
            valor={form.tipo}
            onChange={(v) => cambiar('tipo', v)}
          />
        </>
      )}

      {paso === 2 && (
        <>
          <Text style={styles.titulo}>¿Qué es?</Text>
          <ChipSelector
            opciones={aOpciones(CATEGORIAS)}
            valor={form.categoria}
            onChange={(v) => cambiar('categoria', v)}
          />
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

      {paso === 3 && (
        <>
          <Text style={styles.titulo}>¿Cuándo y dónde?</Text>

          <Text style={styles.etiqueta}>Fecha</Text>
          <Pressable style={styles.input} onPress={() => setMostrarFecha(true)}>
            <Text style={{ color: COLORS.text }}>
              {form.fechaSuceso.toLocaleDateString('es-AR')}
            </Text>
          </Pressable>
          {mostrarFecha && (
            <DateTimePicker
              value={form.fechaSuceso}
              mode="date"
              maximumDate={new Date()}
              onChange={(event, fecha) => {
                setMostrarFecha(false); // en Android el selector se cierra solo
                if (event.type === 'set' && fecha) cambiar('fechaSuceso', fecha);
              }}
            />
          )}

          <Text style={styles.etiqueta}>Momento del día</Text>
          <ChipSelector
            opciones={aOpciones(FRANJAS)}
            valor={form.franjaHoraria}
            onChange={(v) => cambiar('franjaHoraria', v)}
          />

          <Text style={styles.etiqueta}>Barrio</Text>
          <TextInput
            style={styles.input}
            value={form.barrio}
            onChangeText={(t) => cambiar('barrio', t)}
            placeholder="Ej: Belgrano"
          />

          <Text style={styles.etiqueta}>Dirección exacta (opcional, no es pública)</Text>
          <TextInput
            style={styles.input}
            value={form.direccionExacta}
            onChangeText={(t) => cambiar('direccionExacta', t)}
            placeholder="Calle y altura"
          />

          <Pressable
            style={[styles.boton, styles.botonSecundario]}
            onPress={usarMiUbicacion}
            disabled={buscandoUbicacion}
          >
            <Text style={styles.botonSecundarioTexto}>
              {buscandoUbicacion
                ? 'Buscando…'
                : form.latitud
                  ? 'Ubicación guardada ✓ (tocá para actualizar)'
                  : 'Usar mi ubicación actual'}
            </Text>
          </Pressable>
        </>
      )}

      {paso === 4 && (
        <>
          <Text style={styles.titulo}>Fotos</Text>
          <Text style={styles.ayuda}>Una buena foto ayuda a reconocer el objeto.</Text>
          <SelectorFotos fotos={fotos} onChange={setFotos} />
        </>
      )}

      <View style={styles.botones}>
        {paso > 1 && (
          <Pressable
            style={[styles.boton, styles.botonSecundario]}
            onPress={() => setPaso(paso - 1)}
          >
            <Text style={styles.botonSecundarioTexto}>Atrás</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.boton, guardando && styles.botonInactivo]}
          onPress={siguiente}
          disabled={guardando}
        >
          <Text style={styles.botonTexto}>
            {guardando ? 'Guardando…' : paso === TOTAL_PASOS ? 'Publicar' : 'Siguiente'}
          </Text>
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