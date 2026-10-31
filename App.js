import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from './config';
import { getErrorMessage } from './services/api';
import * as alertas from './services/alertas';
import * as seguidas from './services/seguidas';

// PROVISORIO: entrada para probar alertas y seguidas hasta que exista la navegación real.
// Borrar cuando se integre el navigator definitivo.
export default function App() {
  const [resultado, setResultado] = useState('Tocá una acción');
  const [cargando, setCargando] = useState(false);

  const correr = async (nombre, accion) => {
    setCargando(true);
    try {
      const data = await accion();
      setResultado(`${nombre}\n\n${data === undefined ? 'OK' : JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResultado(`${nombre}\n\nERROR: ${getErrorMessage(error)}`);
    } finally {
      setCargando(false);
    }
  };

  const primeraAlerta = async () => (await alertas.listarAlertas())[0];
  const primeraSeguida = async () => (await seguidas.listarSeguidas())[0];

  const acciones = [
    ['Listar alertas', () => alertas.listarAlertas()],
    ['Crear alerta', () => alertas.crearAlerta({ nombre: 'Prueba', tipo: 'PERDIDO', categoria: 'OTROS' })],
    ['Pausar/reactivar 1ra alerta', async () => {
      const a = await primeraAlerta();
      if (!a) return 'No hay alertas';
      await (a.activa ? alertas.pausarAlerta(a.id) : alertas.reactivarAlerta(a.id));
      return alertas.listarAlertas();
    }],
    ['Marcar 1ra alerta revisada', async () => {
      const a = await primeraAlerta();
      if (!a) return 'No hay alertas';
      await alertas.marcarAlertaRevisada(a.id);
      return alertas.listarAlertas();
    }],
    ['Eliminar 1ra alerta', async () => {
      const a = await primeraAlerta();
      if (!a) return 'No hay alertas';
      await alertas.eliminarAlerta(a.id);
      return alertas.listarAlertas();
    }],
    ['Listar seguidas', () => seguidas.listarSeguidas()],
    ['Marcar 1ra seguida vista', async () => {
      const p = await primeraSeguida();
      if (!p) return 'No hay seguidas';
      await seguidas.marcarSeguidaVista(p.id);
      return seguidas.listarSeguidas();
    }],
    ['Dejar de seguir 1ra', async () => {
      const p = await primeraSeguida();
      if (!p) return 'No hay seguidas';
      await seguidas.dejarDeSeguir(p.id);
      return seguidas.listarSeguidas();
    }],
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.titulo}>Prueba de servicios</Text>
        <Text style={styles.modo}>
          Modo: {process.env.EXPO_PUBLIC_MOCKS === 'true' ? 'todo simulado' : `backend ${process.env.EXPO_PUBLIC_API_URL ?? '(sin URL)'}`}
        </Text>
        <View style={styles.botones}>
          {acciones.map(([nombre, accion]) => (
            <Pressable
              key={nombre}
              style={[styles.boton, cargando && styles.botonDeshabilitado]}
              disabled={cargando}
              onPress={() => correr(nombre, accion)}
            >
              <Text style={styles.botonTexto}>{nombre}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView style={styles.resultado}>
          <Text style={styles.resultadoTexto}>{cargando ? 'Cargando…' : resultado}</Text>
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  modo: { color: COLORS.muted, marginBottom: 12 },
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  boton: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  botonDeshabilitado: { opacity: 0.5 },
  botonTexto: { color: '#fff' },
  resultado: { flex: 1, marginTop: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 8 },
  resultadoTexto: { fontFamily: 'monospace', fontSize: 12, color: COLORS.text },
});
