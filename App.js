import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from './config';
import MisAlertasScreen from './screens/MisAlertasScreen';
import SeguidasScreen from './screens/SeguidasScreen';
import BotonGuardarAlerta from './components/BotonGuardarAlerta';
import BotonSeguir from './components/BotonSeguir';
import Badge from './components/Badge';
import useNovedades from './hooks/useNovedades';
import { getErrorMessage } from './services/api';
import { listarHistorial } from './services/historial';
import { agradecer, listarAgradecimientos, valorar } from './services/valoraciones';

// PROVISORIO: entrada para probar alertas y seguidas hasta que exista la navegación real.
// Borrar cuando se integre el navigator definitivo.
const CRITERIOS_PRUEBA = {
  tipo: 'PERDIDO',
  categoria: 'ELECTRONICA',
  palabrasClave: 'auriculares',
  barrio: 'Belgrano',
  rango: 'ULTIMOS_3_DIAS',
};

function PruebaGuardarAlerta() {
  const [ultima, setUltima] = useState(null);
  return (
    <View style={styles.prueba}>
      <Text style={styles.pruebaTexto}>Criterios de ejemplo (los pasa el buscador):</Text>
      <Text style={styles.pruebaCodigo}>{JSON.stringify(CRITERIOS_PRUEBA, null, 2)}</Text>
      <BotonGuardarAlerta criterios={CRITERIOS_PRUEBA} onGuardada={setUltima} />
      {ultima ? <Text style={styles.pruebaCodigo}>{JSON.stringify(ultima, null, 2)}</Text> : null}
    </View>
  );
}

// Reemplaza al detalle real (lo hace otro integrante) para probar la navegación y BotonSeguir.
function PruebaDetalle({ publicacionId, onVolver }) {
  return (
    <View style={styles.prueba}>
      <Pressable onPress={onVolver}>
        <Text style={styles.volver}>‹ Volver</Text>
      </Pressable>
      <Text style={styles.pruebaTexto}>Detalle provisorio de la publicación #{publicacionId}</Text>
      <BotonSeguir publicacionId={publicacionId} siguiendo />
    </View>
  );
}

// Prueba de los services del punto 10 hasta que estén las pantallas.
const ACCIONES_HISTORIAL = [
  ['Historial completo', () => listarHistorial()],
  ['Solo Devolví', () => listarHistorial({ rol: 'DEVOLVI' })],
  ['Solo Recuperé', () => listarHistorial({ rol: 'RECUPERE' })],
  ['Valorar #201 (en plazo)', () => valorar({ publicacionId: 201, positiva: true, comentario: 'Muy amable' })],
  ['Valorar #203 (ya valorada)', () => valorar({ publicacionId: 203, positiva: false })],
  ['Valorar #204 (fuera de plazo)', () => valorar({ publicacionId: 204, positiva: true })],
  ['Agradecer #202', () => agradecer({ publicacionId: 202, mensaje: 'Gracias Diego!' })],
  ['Agradecer #201 (devolví)', () => agradecer({ publicacionId: 201, mensaje: 'Gracias' })],
  ['Agradecimientos de Diego (32)', () => listarAgradecimientos(32)],
  ['Agradecimientos de Sofía (33)', () => listarAgradecimientos(33)],
];

function PruebaHistorial() {
  const [resultado, setResultado] = useState('Tocá una acción');
  const [cargando, setCargando] = useState(false);

  const correr = async (nombre, accion) => {
    setCargando(true);
    try {
      const data = await accion();
      setResultado(`${nombre}\n\n${data === undefined ? 'OK' : JSON.stringify(data, null, 2)}`);
    } catch (e) {
      setResultado(`${nombre}\n\nERROR: ${getErrorMessage(e)}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.prueba}>
      <View style={styles.pruebaBotones}>
        {ACCIONES_HISTORIAL.map(([nombre, accion]) => (
          <Pressable
            key={nombre}
            style={[styles.pruebaBoton, cargando && styles.pruebaBotonDeshabilitado]}
            disabled={cargando}
            onPress={() => correr(nombre, accion)}
          >
            <Text style={styles.pruebaBotonTexto}>{nombre}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView style={styles.pruebaResultado}>
        <Text style={styles.pruebaCodigo}>{cargando ? 'Cargando…' : resultado}</Text>
      </ScrollView>
    </View>
  );
}

const PANTALLAS = [
  { clave: 'alertas', titulo: 'Mis alertas', Componente: MisAlertasScreen },
  { clave: 'seguidas', titulo: 'Seguidas', Componente: SeguidasScreen },
  { clave: 'guardar', titulo: 'Probar guardar', Componente: PruebaGuardarAlerta },
  { clave: 'historial', titulo: 'Probar 10', Componente: PruebaHistorial },
];

export default function App() {
  const [actual, setActual] = useState(PANTALLAS[0].clave);
  const [detalleId, setDetalleId] = useState(null);
  const novedades = useNovedades();
  const { Componente } = PANTALLAS.find((p) => p.clave === actual);

  const irA = (clave) => {
    setDetalleId(null);
    setActual(clave);
    novedades.recargar();
  };

  const volverDelDetalle = () => {
    setDetalleId(null);
    novedades.recargar();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.selector}>
          {PANTALLAS.map((p) => (
            <Pressable
              key={p.clave}
              style={[styles.opcion, p.clave === actual && styles.opcionActiva]}
              onPress={() => irA(p.clave)}
            >
              <Text style={[styles.opcionTexto, p.clave === actual && styles.opcionTextoActiva]}>
                {p.titulo}
              </Text>
              {novedades[p.clave] > 0 ? <Badge texto={String(novedades[p.clave])} /> : null}
            </Pressable>
          ))}
        </View>
        {detalleId ? (
          <PruebaDetalle publicacionId={detalleId} onVolver={volverDelDetalle} />
        ) : (
          <Componente key={actual} onAbrirPublicacion={setDetalleId} onNovedadesVistas={novedades.recargar} />
        )}
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  selector: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border },
  opcion: { flex: 1, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  opcionActiva: { borderBottomWidth: 2, borderColor: COLORS.primary },
  opcionTexto: { color: COLORS.muted },
  opcionTextoActiva: { color: COLORS.primary, fontWeight: 'bold' },
  prueba: { flex: 1, padding: 16, gap: 12 },
  pruebaTexto: { color: COLORS.muted },
  pruebaCodigo: { fontFamily: 'monospace', fontSize: 12, color: COLORS.text },
  volver: { color: COLORS.primary, fontSize: 16 },
  pruebaBotones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pruebaBoton: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6 },
  pruebaBotonDeshabilitado: { opacity: 0.5 },
  pruebaBotonTexto: { color: '#fff', fontSize: 12 },
  pruebaResultado: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 },
});
