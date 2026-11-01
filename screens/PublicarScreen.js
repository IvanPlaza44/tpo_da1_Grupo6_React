import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import ChipSelector from '../components/ChipSelector';
import { EstadoCargando } from '../components/EstadoPantalla';
import SelectorFotos from '../components/SelectorFotos';
import { COLORS } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useConexion } from '../hooks/useConexion';
import { getErrorMessage } from '../services/api';
import { agregarPendiente, procesarItem } from '../services/colaPendientes';
import {
  actualizarPublicacion,
  crearPublicacion,
  eliminarPublicacion,
  obtenerMisBorradores,
  obtenerPublicacion,
} from '../services/publicaciones';
import { CATEGORIAS, TIPOS } from '../utils/etiquetas';
import { aFechaISO, aHoraISO, franjaDeHora, parseFechaISO, parseHora } from '../utils/fechaLocal';
import { aOpciones } from '../utils/publicarOpciones';

const TOTAL_PASOS = 4;

const formInicial = () => ({
  tipo: null,
  categoria: null,
  titulo: '',
  descripcion: '',
  preguntaVerificacion: '',
  respuestaVerificacion: '',
  fechaSuceso: new Date(),
  horaSuceso: new Date(),
  barrio: '',
  direccionExacta: '',
  latitud: null,
  longitud: null,
});

// Arma el objeto con TODOS los datos de la publicación, listo para mandar al servidor.
const armarDatos = (form) => ({
  categoria: form.categoria,
  titulo: form.titulo.trim(),
  descripcion: form.descripcion.trim(),
  fechaSuceso: aFechaISO(form.fechaSuceso),
  horaSuceso: aHoraISO(form.horaSuceso),
  franjaHoraria: franjaDeHora(form.horaSuceso),
  barrio: form.barrio.trim(),
  direccionExacta: form.direccionExacta.trim() || null,
  latitud: form.latitud,
  longitud: form.longitud,
  // La pregunta y su respuesta solo existen si encontró algo
  ...(form.tipo === 'ENCONTRADO' && {
    preguntaVerificacion: form.preguntaVerificacion.trim(),
    respuestaVerificacion: form.respuestaVerificacion.trim(),
  }),
});

export default function PublicarScreen() {
  const { user } = useAuth();
  const { conectado } = useConexion();

  // modo: 'cargando' (buscando borradores) | 'borradores' (elegir uno) | 'formulario'
  const [modo, setModo] = useState('cargando');
  const [borradores, setBorradores] = useState([]);
  const [paso, setPaso] = useState(1);
  const [publicacionId, setPublicacionId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadaSinConexion, setGuardadaSinConexion] = useState(false);
  const [form, setForm] = useState(formInicial());
  const [fotos, setFotos] = useState([]);
  const [fotosRemotas, setFotosRemotas] = useState([]); // fotos que el borrador ya tiene en el servidor
  const [fotosSubidas, setFotosSubidas] = useState([]);
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [mostrarHora, setMostrarHora] = useState(false);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

  const cambiar = (campo, valor) => setForm((anterior) => ({ ...anterior, [campo]: valor }));

  // Al abrir la pantalla: si hay borradores guardados, se ofrece retomarlos.
  useEffect(() => {
    const buscar = async () => {
      try {
        const lista = await obtenerMisBorradores();
        setBorradores(lista);
        setModo(lista.length > 0 ? 'borradores' : 'formulario');
      } catch (error) {
        setModo('formulario'); // sin conexión: directo al formulario
      }
    };
    buscar();
  }, []);

  const reiniciar = () => {
    setPaso(1);
    setPublicacionId(null);
    setFotos([]);
    setFotosRemotas([]);
    setFotosSubidas([]);
    setGuardadaSinConexion(false);
    setForm(formInicial());
  };

  const empezarNuevo = () => {
    reiniciar();
    setModo('formulario');
  };

  // Carga el borrador del servidor, rellena el formulario y salta al primer paso incompleto.
  const retomar = async (item) => {
    try {
      setGuardando(true);
      const d = await obtenerPublicacion(item.id);
      setPublicacionId(d.id);
      setFotos([]);
      setFotosSubidas([]);
      setFotosRemotas(d.fotos || []);
      setForm({
        tipo: d.tipo,
        categoria: d.categoria || null,
        titulo: d.titulo || '',
        descripcion: d.descripcion || '',
        preguntaVerificacion: d.preguntaVerificacion || '',
        respuestaVerificacion: d.respuestaVerificacion || '',
        fechaSuceso: d.fechaSuceso ? parseFechaISO(d.fechaSuceso) : new Date(),
        horaSuceso: d.horaSuceso ? parseHora(d.horaSuceso) : new Date(),
        barrio: d.barrio || '',
        direccionExacta: d.direccionExacta || '',
        latitud: d.latitud ?? null,
        longitud: d.longitud ?? null,
      });
      let pasoInicial = 2;
      if (d.categoria && d.titulo) pasoInicial = 3;
      if (d.categoria && d.titulo && d.barrio && d.fechaSuceso) pasoInicial = 4;
      setPaso(pasoInicial);
      setModo('formulario');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  const descartar = (item) => {
    Alert.alert('Descartar borrador', '¿Eliminar este borrador?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarPublicacion(item.id);
            const restantes = borradores.filter((b) => b.id !== item.id);
            setBorradores(restantes);
            if (restantes.length === 0) empezarNuevo();
          } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
          }
        },
      },
    ]);
  };

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
        // Con conexión se crea el borrador ya. Sin conexión se crea recién al enviar.
        if (conectado) {
          const creada = publicacionId
            ? await actualizarPublicacion(publicacionId, { tipo: form.tipo })
            : await crearPublicacion({ tipo: form.tipo });
          setPublicacionId(creada.id);
        }
      }

      if (paso === 2) {
        if (!form.categoria || !form.titulo.trim()) {
          return Alert.alert('Falta algo', 'Elegí una categoría y escribí un título');
        }
        const esEncontrado = form.tipo === 'ENCONTRADO';
        if (esEncontrado && (!form.preguntaVerificacion.trim() || !form.respuestaVerificacion.trim())) {
          return Alert.alert('Falta algo', 'Cargá la pregunta de verificación y su respuesta');
        }
        if (conectado && publicacionId) {
          await actualizarPublicacion(publicacionId, {
            categoria: form.categoria,
            titulo: form.titulo.trim(),
            descripcion: form.descripcion.trim(),
            ...(esEncontrado && {
              preguntaVerificacion: form.preguntaVerificacion.trim(),
              respuestaVerificacion: form.respuestaVerificacion.trim(),
            }),
          });
        }
      }

      if (paso === 3) {
        if (!form.barrio.trim()) {
          return Alert.alert('Falta algo', 'Indicá el barrio donde ocurrió');
        }
        // Se junta fecha + hora en un solo momento para chequear que no sea futuro.
        const f = form.fechaSuceso;
        const h = form.horaSuceso;
        const momento = new Date(f.getFullYear(), f.getMonth(), f.getDate(), h.getHours(), h.getMinutes());
        if (momento > new Date()) {
          return Alert.alert('Fecha inválida', 'La fecha y hora no pueden ser futuras');
        }
        if (conectado && publicacionId) {
          await actualizarPublicacion(publicacionId, {
            fechaSuceso: aFechaISO(f),
            horaSuceso: aHoraISO(h),
            franjaHoraria: franjaDeHora(h),
            barrio: form.barrio.trim(),
            direccionExacta: form.direccionExacta.trim() || null,
            latitud: form.latitud,
            longitud: form.longitud,
          });
        }
      }

      if (paso === 4) {
        if (fotos.length + fotosRemotas.length === 0) {
          return Alert.alert('Falta algo', 'Agregá al menos una foto');
        }
        // Solo guardamos lo mínimo de cada foto (el resto del objeto de la cámara no hace falta).
        const fotosLimpias = fotos.map((f) => ({ uri: f.uri, fileName: f.fileName, mimeType: f.mimeType }));
        const item = {
          idLocal: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          creadoEn: Date.now(),
          tipo: form.tipo,
          publicacionId,
          datos: armarDatos(form),
          fotos: fotosLimpias,
          fotosSubidas,
        };

        if (!conectado) {
          // SIN CONEXIÓN: queda en la cola, "pendiente de envío"
          await agregarPendiente(user.usuarioId, item);
          setGuardadaSinConexion(true);
        } else {
          // CON CONEXIÓN: se envía ahora; si falla a la mitad, recordamos hasta dónde llegó.
          await procesarItem(item, (p) => {
            setPublicacionId(p.publicacionId);
            setFotosSubidas(p.fotosSubidas);
          });
        }
      }

      setPaso((p) => Math.min(p + 1, TOTAL_PASOS + 1));
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  if (modo === 'cargando') return <EstadoCargando />;

  if (modo === 'borradores') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Tenés borradores sin terminar</Text>
        {borradores.map((b) => (
          <View key={b.id} style={styles.tarjeta}>
            <Text style={styles.tarjetaTitulo}>{b.titulo || 'Sin título'}</Text>
            <Text style={styles.ayudaIzq}>
              {TIPOS[b.tipo]} · {CATEGORIAS[b.categoria] || 'Sin categoría'}
            </Text>
            <View style={styles.botones}>
              <Pressable style={[styles.boton, styles.botonSecundario]} onPress={() => descartar(b)}>
                <Text style={styles.botonSecundarioTexto}>Descartar</Text>
              </Pressable>
              <Pressable style={styles.boton} onPress={() => retomar(b)} disabled={guardando}>
                <Text style={styles.botonTexto}>Retomar</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable style={[styles.boton, styles.botonSecundario]} onPress={empezarNuevo}>
          <Text style={styles.botonSecundarioTexto}>Empezar una publicación nueva</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (paso > TOTAL_PASOS) {
    return (
      <View style={styles.centro}>
        {guardadaSinConexion ? (
          <>
            <Text style={styles.titulo}>Guardada sin conexión</Text>
            <Text style={styles.ayuda}>
              Quedó pendiente de envío. Se va a publicar automáticamente cuando recuperes internet.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.titulo}>¡Publicación #{publicacionId} publicada!</Text>
            <Text style={styles.ayuda}>
              Ya la pueden ver otros usuarios en el buscador. Vence en 30 días y podés renovarla.
            </Text>
          </>
        )}
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

          {form.tipo === 'ENCONTRADO' && (
            <>
              <Text style={styles.etiqueta}>Pregunta de verificación</Text>
              <Text style={styles.ayudaIzq}>
                Un detalle que no se vea en las fotos, para comprobar que quien lo reclama es el dueño.
              </Text>
              <TextInput
                style={styles.input}
                value={form.preguntaVerificacion}
                onChangeText={(t) => cambiar('preguntaVerificacion', t)}
                placeholder="Ej: ¿De qué color es el llavero?"
              />
              <Text style={styles.etiqueta}>Respuesta (privada)</Text>
              <TextInput
                style={styles.input}
                value={form.respuestaVerificacion}
                onChangeText={(t) => cambiar('respuestaVerificacion', t)}
                placeholder="Solo la ves vos"
              />
            </>
          )}
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
                setMostrarFecha(false);
                if (event.type === 'set' && fecha) cambiar('fechaSuceso', fecha);
              }}
            />
          )}

          <Text style={styles.etiqueta}>Hora aproximada</Text>
          <Pressable style={styles.input} onPress={() => setMostrarHora(true)}>
            <Text style={{ color: COLORS.text }}>{aHoraISO(form.horaSuceso)}</Text>
          </Pressable>
          {mostrarHora && (
            <DateTimePicker
              value={form.horaSuceso}
              mode="time"
              is24Hour
              onChange={(event, hora) => {
                setMostrarHora(false);
                if (event.type === 'set' && hora) cambiar('horaSuceso', hora);
              }}
            />
          )}

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
          {fotosRemotas.length > 0 && (
            <Text style={styles.ayudaIzq}>
              Este borrador ya tiene {fotosRemotas.length} foto(s) subida(s).
            </Text>
          )}
          {!conectado && (
            <Text style={styles.avisoSinConexion}>
              Sin conexión: la publicación va a quedar pendiente de envío y se publicará sola cuando vuelva internet.
            </Text>
          )}
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
            {guardando
              ? 'Guardando…'
              : paso === TOTAL_PASOS
                ? conectado ? 'Publicar' : 'Guardar para enviar'
                : 'Siguiente'}
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
  ayudaIzq: { color: COLORS.muted },
  avisoSinConexion: { color: '#92400e', backgroundColor: '#fef3c7', padding: 8, borderRadius: 6, fontSize: 13 },
  etiqueta: { color: COLORS.text, fontWeight: '600', marginTop: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, color: COLORS.text },
  inputGrande: { minHeight: 90, textAlignVertical: 'top' },
  botones: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boton: { flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  botonInactivo: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
  botonSecundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  botonSecundarioTexto: { color: COLORS.text },
  tarjeta: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, gap: 4 },
  tarjetaTitulo: { fontWeight: 'bold', color: COLORS.text },
});