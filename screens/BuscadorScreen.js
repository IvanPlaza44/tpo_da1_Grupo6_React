import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import Chips from '../components/Chips';
import { COLORS, RADIUS, SPACE } from '../config';
import { BARRIOS, CATEGORIAS, RANGOS, TIPOS } from '../config/filtros';
import { guardarBusquedaReciente, obtenerBusquedasRecientes } from '../utils/busquedasRecientes';
import { aFechaIso as aISO, formatearFecha as legible } from '../utils/fechas';
import { resumenFiltros, sinVacios } from '../utils/filtros';

// Para comparar sin importar mayúsculas ni tildes ("nunez" encuentra "Núñez").
const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function BuscadorScreen({ navigation, onIrA }) {
  const [tipo, setTipo] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [palabrasClave, setPalabrasClave] = useState('');
  const [barrio, setBarrio] = useState('');
  const [rango, setRango] = useState(null);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const [selectorAbierto, setSelectorAbierto] = useState(null); // 'desde' | 'hasta' | null
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [recientes, setRecientes] = useState([]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Cada vez que se vuelve a esta pantalla, se recargan las últimas búsquedas.
  useFocusEffect(
    useCallback(() => {
      obtenerBusquedasRecientes().then(setRecientes);
    }, [])
  );

  const textoBarrio = normalizar(barrio.trim());
  const sugerencias = textoBarrio
    ? BARRIOS.filter(
        (b) => normalizar(b).includes(textoBarrio) && normalizar(b) !== textoBarrio
      ).slice(0, 5)
    : [];

  const usarUbicacionActual = async () => {
    try {
      setBuscandoUbicacion(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Sin el permiso de ubicación, escribí el barrio o elegilo de la lista.');
        return;
      }
      const posicion = await Location.getCurrentPositionAsync({});
      const [lugar] = await Location.reverseGeocodeAsync(posicion.coords);
      const nombre = lugar?.district || lugar?.subregion || lugar?.city;
      if (nombre) {
        setBarrio(nombre); // queda editable por si el nombre no es el que buscabas
      } else {
        Alert.alert('No pudimos detectar el barrio', 'Escribilo o elegilo de la lista.');
      }
    } catch (error) {
      Alert.alert('Error', 'No pudimos obtener tu ubicación. Revisá que el GPS esté activado.');
    } finally {
      setBuscandoUbicacion(false);
    }
  };

  const alElegirFecha = (evento, fecha) => {
    const cual = selectorAbierto;
    setSelectorAbierto(null);
    if (evento.type !== 'set' || !fecha) return;
    if (cual === 'desde') setFechaDesde(fecha);
    else setFechaHasta(fecha);
  };

  const irAResultados = async (filtros) => {
    try {
      await guardarBusquedaReciente(filtros);
    } catch (error) {
      // Si no se puede guardar el historial, igual se hace la búsqueda.
    }
    navigation.navigate('Resultados', { filtros });
  };

  const buscar = () => {
    if (!tipo) {
      Alert.alert('Falta un dato', 'Contanos qué te pasó: perdí algo o encontré algo.');
      return;
    }
    const filtros = {
      tipo,
      categoria,
      palabrasClave: palabrasClave.trim(),
      barrio: barrio.trim(),
      rango,
    };
    if (rango === 'RANGO') {
      if (!fechaDesde || !fechaHasta) {
        Alert.alert('Faltan fechas', 'Elegí la fecha desde y la fecha hasta.');
        return;
      }
      if (fechaDesde > fechaHasta) {
        Alert.alert('Fechas incorrectas', 'La fecha "desde" no puede ser posterior a la fecha "hasta".');
        return;
      }
      filtros.fechaDesde = aISO(fechaDesde);
      filtros.fechaHasta = aISO(fechaHasta);
    }
    irAResultados(sinVacios(filtros));
  };

  const resumenExtra = resumenFiltros(
    sinVacios({
      categoria,
      palabrasClave: palabrasClave.trim(),
      barrio: barrio.trim(),
      rango,
      fechaDesde: rango === 'RANGO' && fechaDesde ? aISO(fechaDesde) : null,
      fechaHasta: rango === 'RANGO' && fechaHasta ? aISO(fechaHasta) : null,
    })
  );

  return (
    <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <Text style={styles.hero}>¿Qué te pasó?</Text>

      <View style={styles.eleccion}>
        {TIPOS.map((opcion) => {
          const activo = tipo === opcion.value;
          const perdido = opcion.value === 'PERDIDO';
          return (
            <TouchableOpacity
              key={opcion.value}
              style={[
                styles.eleccionItem,
                activo && (perdido ? styles.eleccionPerdida : styles.eleccionEncontrada),
              ]}
              onPress={() => setTipo(opcion.value)}
            >
              <Text style={[styles.eleccionTexto, activo && styles.eleccionTextoActiva]}>{opcion.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.botonFiltros} onPress={() => setFiltrosAbiertos((abierto) => !abierto)}>
        <Text style={styles.botonFiltrosTexto}>
          {filtrosAbiertos ? 'Ocultar filtros' : 'Ajustar categoría, lugar y fecha'}
        </Text>
      </TouchableOpacity>

      {!filtrosAbiertos && resumenExtra ? <Text style={styles.resumenFiltros}>{resumenExtra}</Text> : null}

      {filtrosAbiertos ? (
        <>
          <View style={styles.bloque}>
            <Text style={styles.pregunta}>¿Qué es?</Text>
            <Chips opciones={CATEGORIAS} valor={categoria} onChange={setCategoria} permitirVacio />
            <TextInput
              style={styles.input}
              placeholder="Palabras clave, si las tenés"
              placeholderTextColor={COLORS.muted}
              value={palabrasClave}
              onChangeText={setPalabrasClave}
            />
          </View>

          <View style={styles.bloque}>
            <Text style={styles.pregunta}>¿Dónde?</Text>
            <TextInput
              style={styles.input}
              placeholder="Barrio o localidad"
              placeholderTextColor={COLORS.muted}
              value={barrio}
              onChangeText={setBarrio}
            />
            {sugerencias.length > 0 ? (
              <View style={styles.sugerencias}>
                {sugerencias.map((sugerencia) => (
                  <TouchableOpacity key={sugerencia} style={styles.sugerencia} onPress={() => setBarrio(sugerencia)}>
                    <Text style={styles.sugerenciaTexto}>{sugerencia}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <TouchableOpacity style={styles.botonSecundario} onPress={usarUbicacionActual} disabled={buscandoUbicacion}>
              {buscandoUbicacion ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.botonSecundarioTexto}>Usar mi ubicación</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bloque}>
            <Text style={styles.pregunta}>¿Cuándo?</Text>
            <Chips opciones={RANGOS} valor={rango} onChange={setRango} permitirVacio />
            {rango === 'RANGO' && (
              <View style={styles.filaFechas}>
                <TouchableOpacity style={styles.botonFecha} onPress={() => setSelectorAbierto('desde')}>
                  <Text style={styles.botonFechaTexto}>
                    Desde: {fechaDesde ? legible(aISO(fechaDesde)) : 'elegir'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botonFecha} onPress={() => setSelectorAbierto('hasta')}>
                  <Text style={styles.botonFechaTexto}>
                    Hasta: {fechaHasta ? legible(aISO(fechaHasta)) : 'elegir'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {selectorAbierto && (
              <DateTimePicker
                value={(selectorAbierto === 'desde' ? fechaDesde : fechaHasta) || new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={alElegirFecha}
              />
            )}
          </View>
        </>
      ) : null}

      <TouchableOpacity style={styles.botonPrincipal} onPress={buscar}>
        <Text style={styles.botonPrincipalTexto}>Buscar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botonPublicar} onPress={() => onIrA?.('publicar')}>
        <Text style={styles.botonPublicarTexto}>Publicar algo perdido o encontrado</Text>
      </TouchableOpacity>

      {recientes.length > 0 && (
        <View style={styles.bloque}>
          <Text style={styles.pregunta}>Búsquedas recientes</Text>
          {recientes.map((filtros, indice) => (
            <TouchableOpacity key={indice} style={styles.reciente} onPress={() => irAResultados(filtros)}>
              <Text style={styles.recienteTexto}>{resumenFiltros(filtros)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: SPACE.lg, paddingBottom: 48, gap: SPACE.md },
  hero: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  eleccion: { flexDirection: 'row', gap: SPACE.sm },
  eleccionItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  eleccionPerdida: { backgroundColor: COLORS.perdido },
  eleccionEncontrada: { backgroundColor: COLORS.encontrado },
  eleccionTexto: { color: COLORS.text, fontWeight: '700', textAlign: 'center' },
  eleccionTextoActiva: { color: COLORS.white },
  bloque: { gap: SPACE.sm, marginTop: SPACE.sm },
  pregunta: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  sugerencias: { backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, overflow: 'hidden' },
  sugerencia: { paddingVertical: 12, paddingHorizontal: 14 },
  sugerenciaTexto: { color: COLORS.text },
  botonSecundario: { paddingVertical: 12, alignItems: 'center' },
  botonSecundarioTexto: { color: COLORS.primary, fontWeight: '700' },
  filaFechas: { flexDirection: 'row', gap: SPACE.sm },
  botonFecha: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonFechaTexto: { color: COLORS.text, fontWeight: '600' },
  botonPrincipal: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACE.sm,
  },
  botonPrincipalTexto: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  botonPublicar: { alignItems: 'center', paddingVertical: 8 },
  botonPublicarTexto: { color: COLORS.primary, fontWeight: '700' },
  botonFiltros: { alignItems: 'center', paddingVertical: 4 },
  botonFiltrosTexto: { color: COLORS.primary, fontWeight: '700' },
  resumenFiltros: { color: COLORS.muted, textAlign: 'center', fontSize: 13 },
  reciente: { backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, padding: 14 },
  recienteTexto: { color: COLORS.text, fontWeight: '600' },
});