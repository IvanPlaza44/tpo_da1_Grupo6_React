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
import { COLORS } from '../config';
import { BARRIOS, CATEGORIAS, RANGOS, TIPOS } from '../config/filtros';
import { guardarBusquedaReciente, obtenerBusquedasRecientes } from '../utils/busquedasRecientes';
import { aFechaIso as aISO, formatearFecha as legible } from '../utils/fechas';
import { resumenFiltros, sinVacios } from '../utils/filtros';

// Para comparar sin importar mayúsculas ni tildes ("nunez" encuentra "Núñez").
const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function BuscadorScreen({ navigation }) {
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

  return (
    <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <Text style={styles.pregunta}>¿Qué te pasó?</Text>
      <Chips opciones={TIPOS} valor={tipo} onChange={setTipo} />

      <Text style={styles.pregunta}>¿Qué es?</Text>
      <Chips opciones={CATEGORIAS} valor={categoria} onChange={setCategoria} permitirVacio />
      <TextInput
        style={styles.input}
        placeholder="Palabras clave (opcional)"
        value={palabrasClave}
        onChangeText={setPalabrasClave}
      />

      <Text style={styles.pregunta}>¿Dónde?</Text>
      <TextInput
        style={styles.input}
        placeholder="Barrio o localidad"
        value={barrio}
        onChangeText={setBarrio}
      />
      {sugerencias.map((sugerencia) => (
        <TouchableOpacity
          key={sugerencia}
          style={styles.sugerencia}
          onPress={() => setBarrio(sugerencia)}
        >
          <Text style={styles.sugerenciaTexto}>{sugerencia}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={usarUbicacionActual}
        disabled={buscandoUbicacion}
      >
        {buscandoUbicacion ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={styles.botonSecundarioTexto}>Usar mi ubicación actual</Text>
        )}
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.botonPrincipal} onPress={buscar}>
        <Text style={styles.botonPrincipalTexto}>Buscar</Text>
      </TouchableOpacity>

      {recientes.length > 0 && (
        <View>
          <Text style={styles.pregunta}>Últimas búsquedas</Text>
          {recientes.map((filtros, indice) => (
            <TouchableOpacity
              key={indice}
              style={styles.reciente}
              onPress={() => irAResultados(filtros)}
            >
              <Text style={styles.recienteTexto}>{resumenFiltros(filtros)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, paddingBottom: 40, gap: 10 },
  pregunta: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  sugerencia: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sugerenciaTexto: { color: COLORS.text },
  botonSecundario: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botonSecundarioTexto: { color: COLORS.primary, fontWeight: '600' },
  filaFechas: { flexDirection: 'row', gap: 10 },
  botonFecha: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botonFechaTexto: { color: COLORS.text },
  botonPrincipal: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botonPrincipalTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reciente: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  recienteTexto: { color: COLORS.text },
});