import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS } from '../config';
import { abrirComoLlegar, aceptarPunto, obtenerEncuentro, proponerPunto } from '../services/puntoEncuentro';
import { getErrorMessage } from '../services/api';
import { EstadoCargando, EstadoError } from '../components/EstadoPantalla';
import { useConexion } from '../hooks/useConexion';

const ESTADOS = {
  PROPUESTO: { texto: 'Propuesto', color: '#b45309', fondo: '#fef3c7' },
  ACEPTADO: { texto: 'Acordado', color: '#15803d', fondo: '#dcfce7' },
};

// Devolución y punto de encuentro (Punto 8).
// - Quien tiene el objeto propone el primer punto.
// - La otra parte lo acepta o propone otro lugar.
// - "Cómo llegar" abre Google Maps en modo navegación.
// Props: reclamoId (un reclamo ACEPTADO), onVolver().
export default function PuntoEncuentroScreen({ reclamoId, onVolver }) {
  const { conectado } = useConexion();
  const [encuentro, setEncuentro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [ubicacion, setUbicacion] = useState(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      setEncuentro(await obtenerEncuentro(reclamoId));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [reclamoId]);

  if (cargando) return <EstadoCargando mensaje="Cargando punto de encuentro…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={cargar} />;

  const { punto, puedoProponer, puedoAceptar, tengoElObjeto } = encuentro;
  const contraparte = encuentro.contraparteNombre || 'la otra persona';
  const formularioVisible = puedoProponer && (!punto || mostrarFormulario);
  const estadoPunto = punto ? ESTADOS[punto.estado] || ESTADOS.PROPUESTO : null;

  const limpiarFormulario = () => {
    setDireccion('');
    setIndicaciones('');
    setUbicacion(null);
    setMostrarFormulario(false);
  };

  const usarMiUbicacion = async () => {
    setBuscandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos tu ubicación para cargar el punto de encuentro.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      setUbicacion({ latitud: coords.latitude, longitud: coords.longitude });
      // Si se puede, convertimos las coordenadas en una dirección legible.
      try {
        const [lugar] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        if (lugar) {
          const calle = [lugar.street, lugar.streetNumber].filter(Boolean).join(' ');
          const zona = lugar.district || lugar.subregion || lugar.city;
          const texto = [calle, zona].filter(Boolean).join(', ');
          if (texto) setDireccion(texto);
        }
      } catch {
        // Si no se puede traducir a dirección, quedan solo las coordenadas.
      }
    } catch {
      Alert.alert('Error', 'No pudimos obtener tu ubicación. Revisá que el GPS esté activado.');
    } finally {
      setBuscandoUbicacion(false);
    }
  };

  const enviarPropuesta = async () => {
    if (!direccion.trim() && !ubicacion) {
      Alert.alert('Faltan datos', 'Escribí una dirección o usá tu ubicación actual.');
      return;
    }
    setEnviando(true);
    try {
      const actualizado = await proponerPunto(reclamoId, {
        direccion,
        indicaciones,
        latitud: ubicacion?.latitud,
        longitud: ubicacion?.longitud,
      });
      setEncuentro(actualizado);
      limpiarFormulario();
      Alert.alert('Propuesta enviada', `${contraparte} va a poder aceptarla o proponer otro lugar.`);
    } catch (e) {
      Alert.alert('No se pudo enviar la propuesta', getErrorMessage(e));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarAceptar = () =>
    Alert.alert(
      'Aceptar punto de encuentro',
      `¿Confirmás que te encontrás con ${contraparte} en ${punto.direccion || 'la ubicación propuesta'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setEnviando(true);
            try {
              setEncuentro(await aceptarPunto(reclamoId, punto.id));
            } catch (e) {
              Alert.alert('No se pudo aceptar', getErrorMessage(e));
            } finally {
              setEnviando(false);
            }
          },
        },
      ]
    );

  const comoLlegar = async () => {
    try {
      await abrirComoLlegar(punto);
    } catch {
      Alert.alert('No se pudo abrir el mapa', 'Revisá que tengas una aplicación de mapas instalada.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {onVolver ? (
        <Pressable onPress={onVolver} style={styles.volver}>
          <Text style={styles.volverTexto}>‹ Volver</Text>
        </Pressable>
      ) : null}

      <Text style={styles.titulo}>Punto de encuentro</Text>

      <View style={styles.resumen}>
        {encuentro.publicacionTitulo ? (
          <Text style={styles.resumenTitulo}>{encuentro.publicacionTitulo}</Text>
        ) : null}
        <Text style={styles.resumenTexto}>Devolución con {contraparte}</Text>
        <Text style={styles.resumenTexto}>
          {tengoElObjeto ? 'Vos tenés el objeto.' : `${contraparte} tiene el objeto.`}
        </Text>
      </View>

      {punto ? (
        <View style={styles.tarjeta}>
          <View style={styles.fila}>
            <Text style={styles.seccion}>
              {punto.propuestoPorMi ? 'Tu propuesta' : `Propuesta de ${punto.propuestoPorNombre || contraparte}`}
            </Text>
            <View style={[styles.estado, { backgroundColor: estadoPunto.fondo }]}>
              <Text style={[styles.estadoTexto, { color: estadoPunto.color }]}>{estadoPunto.texto}</Text>
            </View>
          </View>

          <Text style={styles.direccion}>{punto.direccion || 'Ubicación compartida en el mapa'}</Text>
          {punto.indicaciones ? <Text style={styles.indicaciones}>{punto.indicaciones}</Text> : null}

          <Pressable style={[styles.boton, styles.botonMapa]} onPress={comoLlegar}>
            <Text style={styles.botonTexto}>📍 Cómo llegar</Text>
          </Pressable>

          {punto.estado === 'ACEPTADO' ? (
            <Text style={styles.listo}>¡Listo! Acordaron dónde encontrarse.</Text>
          ) : punto.propuestoPorMi ? (
            <Text style={styles.espera}>Esperando que {contraparte} acepte o proponga otro lugar.</Text>
          ) : null}

          {puedoAceptar && !mostrarFormulario ? (
            <View style={styles.acciones}>
              <Pressable
                style={[styles.boton, styles.botonSecundario, !conectado && styles.botonInactivo]}
                onPress={() => setMostrarFormulario(true)}
                disabled={!conectado || enviando}
              >
                <Text style={styles.botonSecundarioTexto}>Proponer otro lugar</Text>
              </Pressable>
              <Pressable
                style={[styles.boton, styles.botonFlex, !conectado && styles.botonInactivo]}
                onPress={confirmarAceptar}
                disabled={!conectado || enviando}
              >
                {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Aceptar</Text>}
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : !puedoProponer ? (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>
            Esperando que {contraparte} proponga un punto de encuentro. Lo propone quien tiene el objeto.
          </Text>
        </View>
      ) : null}

      {formularioVisible ? (
        <View style={styles.formulario}>
          <Text style={styles.seccionTitulo}>{punto ? 'Proponer otro lugar' : 'Proponé dónde encontrarse'}</Text>

          <Text style={styles.label}>Dirección o lugar</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Av. Corrientes 5000, Villa Crespo"
            value={direccion}
            onChangeText={setDireccion}
            maxLength={500}
          />

          {ubicacion ? (
            <View style={styles.fila}>
              <Text style={styles.ubicacionOk}>✓ Ubicación actual cargada</Text>
              <Pressable onPress={() => setUbicacion(null)}>
                <Text style={styles.linkPeligro}>Quitar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.boton, styles.botonSecundario]}
              onPress={usarMiUbicacion}
              disabled={buscandoUbicacion}
            >
              {buscandoUbicacion ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.botonSecundarioTexto}>Usar mi ubicación actual</Text>
              )}
            </Pressable>
          )}

          <Text style={styles.label}>Día, horario o referencia (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultilinea]}
            placeholder="Ej: Sábado 11 h, en la puerta del supermercado"
            value={indicaciones}
            onChangeText={setIndicaciones}
            multiline
            maxLength={500}
          />

          {!conectado ? (
            <View style={styles.aviso}>
              <Text style={styles.avisoTexto}>Sin conexión: necesitás internet para enviar la propuesta.</Text>
            </View>
          ) : null}

          <View style={styles.acciones}>
            {punto ? (
              <Pressable style={[styles.boton, styles.botonSecundario]} onPress={limpiarFormulario}>
                <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.boton, styles.botonFlex, (enviando || !conectado) && styles.botonInactivo]}
              onPress={enviarPropuesta}
              disabled={enviando || !conectado}
            >
              {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Enviar propuesta</Text>}
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, backgroundColor: COLORS.background },
  volver: { alignSelf: 'flex-start', paddingVertical: 4 },
  volverTexto: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  resumen: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#f9fafb', gap: 2 },
  resumenTitulo: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  resumenTexto: { fontSize: 13, color: COLORS.muted },
  tarjeta: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff', gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  seccion: { fontSize: 13, color: COLORS.muted, flex: 1 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  estado: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  estadoTexto: { fontSize: 12, fontWeight: '600' },
  direccion: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  indicaciones: { fontSize: 14, color: COLORS.text },
  listo: { color: '#15803d', fontWeight: '600' },
  espera: { color: COLORS.muted, fontStyle: 'italic' },
  aviso: { padding: 12, borderRadius: 8, backgroundColor: '#fef3c7' },
  avisoTexto: { color: '#92400e', fontSize: 14 },
  formulario: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  input: { minHeight: 46, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  inputMultilinea: { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' },
  ubicacionOk: { color: '#15803d', fontWeight: '600' },
  linkPeligro: { color: COLORS.danger, fontWeight: '600' },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 4 },
  boton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.primary },
  botonFlex: { flex: 1 },
  botonMapa: { backgroundColor: '#059669' },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
  botonSecundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary },
  botonSecundarioTexto: { color: COLORS.primary, fontWeight: '600' },
  botonInactivo: { opacity: 0.5 },
});