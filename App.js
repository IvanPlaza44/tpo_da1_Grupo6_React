import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from './config';
import MisAlertasScreen from './screens/MisAlertasScreen';
import SeguidasScreen from './screens/SeguidasScreen';

// PROVISORIO: entrada para probar alertas y seguidas hasta que exista la navegación real.
// Borrar cuando se integre el navigator definitivo.
const PANTALLAS = [
  { clave: 'alertas', titulo: 'Mis alertas', Componente: MisAlertasScreen },
  { clave: 'seguidas', titulo: 'Seguidas', Componente: SeguidasScreen },
];

export default function App() {
  const [actual, setActual] = useState(PANTALLAS[0].clave);
  const { Componente } = PANTALLAS.find((p) => p.clave === actual);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.selector}>
          {PANTALLAS.map((p) => (
            <Pressable
              key={p.clave}
              style={[styles.opcion, p.clave === actual && styles.opcionActiva]}
              onPress={() => setActual(p.clave)}
            >
              <Text style={[styles.opcionTexto, p.clave === actual && styles.opcionTextoActiva]}>
                {p.titulo}
              </Text>
            </Pressable>
          ))}
        </View>
        <Componente key={actual} />
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  selector: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border },
  opcion: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  opcionActiva: { borderBottomWidth: 2, borderColor: COLORS.primary },
  opcionTexto: { color: COLORS.muted },
  opcionTextoActiva: { color: COLORS.primary, fontWeight: 'bold' },
});
