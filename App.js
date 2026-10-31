import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from './config';
import MisAlertasScreen from './screens/MisAlertasScreen';
import SeguidasScreen from './screens/SeguidasScreen';
import HistorialScreen from './screens/HistorialScreen';
import BotonGuardarAlerta from './components/BotonGuardarAlerta';
import BotonSeguir from './components/BotonSeguir';
import Badge from './components/Badge';
import ListaAgradecimientos from './components/ListaAgradecimientos';
import useNovedades from './hooks/useNovedades';

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

const PANTALLAS = [
  { clave: 'alertas', titulo: 'Mis alertas', Componente: MisAlertasScreen },
  { clave: 'seguidas', titulo: 'Seguidas', Componente: SeguidasScreen },
  { clave: 'guardar', titulo: 'Probar guardar', Componente: PruebaGuardarAlerta },
  { clave: 'historial', titulo: 'Historial', Componente: HistorialScreen },
];

// Reemplaza al perfil público real (lo hace otro integrante) para probar ListaAgradecimientos.
function PruebaPerfil({ usuarioId, onVolver }) {
  return (
    <ScrollView contentContainerStyle={styles.pruebaScroll}>
      <Pressable onPress={onVolver}>
        <Text style={styles.volver}>‹ Volver</Text>
      </Pressable>
      <Text style={styles.pruebaTexto}>Perfil público provisorio del usuario #{usuarioId}</Text>
      <ListaAgradecimientos usuarioId={usuarioId} />
    </ScrollView>
  );
}

export default function App() {
  const [actual, setActual] = useState(PANTALLAS[0].clave);
  const [detalleId, setDetalleId] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const novedades = useNovedades();
  const { Componente } = PANTALLAS.find((p) => p.clave === actual);

  const irA = (clave) => {
    setDetalleId(null);
    setPerfilId(null);
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
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
        </ScrollView>
        {detalleId ? (
          <PruebaDetalle publicacionId={detalleId} onVolver={volverDelDetalle} />
        ) : perfilId ? (
          <PruebaPerfil usuarioId={perfilId} onVolver={() => setPerfilId(null)} />
        ) : (
          <Componente
            key={actual}
            onAbrirPublicacion={setDetalleId}
            onAbrirPerfil={setPerfilId}
            onNovedadesVistas={novedades.recargar}
          />
        )}
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  selector: { flexGrow: 0, borderBottomWidth: 1, borderColor: COLORS.border },
  opcion: { paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  opcionActiva: { borderBottomWidth: 2, borderColor: COLORS.primary },
  opcionTexto: { color: COLORS.muted },
  opcionTextoActiva: { color: COLORS.primary, fontWeight: 'bold' },
  prueba: { flex: 1, padding: 16, gap: 12 },
  pruebaScroll: { padding: 16, gap: 12 },
  pruebaTexto: { color: COLORS.muted },
  pruebaCodigo: { fontFamily: 'monospace', fontSize: 12, color: COLORS.text },
  volver: { color: COLORS.primary, fontSize: 16 },
});
