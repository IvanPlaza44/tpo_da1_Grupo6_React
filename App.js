import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './config';
import { sinVacios } from './utils/filtros';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import PublicProfileScreen from './screens/PublicProfileScreen';
import MisAlertasScreen from './screens/MisAlertasScreen';
import SeguidasScreen from './screens/SeguidasScreen';
import HistorialScreen from './screens/HistorialScreen';
import MisReclamosScreen from './screens/MisReclamosScreen';
import ReclamarScreen from './screens/ReclamarScreen';
import Badge from './components/Badge';
import { IconoActividad, IconoBuscar, IconoPerfil, IconoPublicar } from './components/ui/IconosTab';
import LogoApp from './components/ui/LogoApp';
import BuscarFlow from './screens/BuscarFlow';
import DetalleScreen from './screens/DetalleScreen';
import useNovedades from './hooks/useNovedades';
import PublicarScreen from './screens/PublicarScreen';
import MisPublicacionesScreen from './screens/MisPublicacionesScreen';
import ActividadScreen from './screens/ActividadScreen';
import PerfilHome from './screens/PerfilHome';
import { ConexionProvider } from './context/ConexionContext';
import BannerSinConexion from './components/BannerSinConexion';
import SincronizadorPendientes from './components/SincronizadorPendientes';

const Stack = createNativeStackNavigator();

// La alerta guarda `rangoFecha`; el buscador filtra con `rango`.
const filtrosDesdeAlerta = (alerta) =>
  sinVacios({
    tipo: alerta.tipo,
    categoria: alerta.categoria,
    palabrasClave: alerta.palabrasClave,
    barrio: alerta.barrio,
    rango: alerta.rangoFecha ?? alerta.rango ?? null,
    fechaDesde: alerta.fechaDesde,
    fechaHasta: alerta.fechaHasta,
  });

const PANTALLAS = {
  buscar: BuscarFlow,
  publicar: PublicarScreen,
  actividad: ActividadScreen,
  alertas: MisAlertasScreen,
  seguidas: SeguidasScreen,
  reclamos: MisReclamosScreen,
  historial: HistorialScreen,
  perfil: PerfilHome,
  'perfil-editar': EditProfileScreen,
  'mis-publicaciones': MisPublicacionesScreen,
};

const SECCION = {
  buscar: 'buscar',
  publicar: 'publicar',
  actividad: 'actividad',
  alertas: 'actividad',
  seguidas: 'actividad',
  reclamos: 'actividad',
  historial: 'actividad',
  perfil: 'perfil',
  'perfil-editar': 'perfil',
  'mis-publicaciones': 'perfil',
};

const SUBSECCION = {
  alertas: { volver: 'actividad', titulo: 'Mis alertas' },
  seguidas: { volver: 'actividad', titulo: 'Seguidas' },
  reclamos: { volver: 'actividad', titulo: 'Mis reclamos' },
  historial: { volver: 'actividad', titulo: 'Historial' },
  'perfil-editar': { volver: 'perfil', titulo: 'Mi perfil' },
  'mis-publicaciones': { volver: 'perfil', titulo: 'Mis publicaciones' },
};

const TABS = [
  { clave: 'buscar', titulo: 'Buscar', Icono: IconoBuscar },
  { clave: 'publicar', titulo: 'Publicar', Icono: IconoPublicar },
  { clave: 'actividad', titulo: 'Actividad', Icono: IconoActividad },
  { clave: 'perfil', titulo: 'Perfil', Icono: IconoPerfil },
];

function AuthenticatedApp() {
  const [actual, setActual] = useState('buscar');
  const [detalleId, setDetalleId] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [reclamarId, setReclamarId] = useState(null);
  const [busquedaAlerta, setBusquedaAlerta] = useState(null);
  const novedades = useNovedades();
  const Componente = PANTALLAS[actual] || BuscarFlow;
  const seccion = SECCION[actual] || 'buscar';
  const subseccion = SUBSECCION[actual];
  const enfocado = Boolean(detalleId || perfilId || reclamarId);

  const irA = (clave, extra) => {
    setDetalleId(null);
    setPerfilId(null);
    setReclamarId(null);
    setBusquedaAlerta(extra?.filtros ?? null);
    setActual(PANTALLAS[clave] ? clave : 'buscar');
    novedades.recargar();
  };

  const volverDelDetalle = () => {
    setDetalleId(null);
    novedades.recargar();
  };

  const novedadesActividad = (novedades.alertas || 0) + (novedades.seguidas || 0);

  return (
    <SafeAreaView style={styles.container}>
      <BannerSinConexion />
      <SincronizadorPendientes />
      <View style={styles.marcaBar}>
        <View style={styles.lado}>
          {subseccion && !enfocado ? (
            <Pressable onPress={() => irA(subseccion.volver)} hitSlop={8}>
              <Text style={styles.volver}>‹ Volver</Text>
            </Pressable>
          ) : null}
        </View>
        <LogoApp size={34} />
        <View style={styles.lado} />
      </View>
      {subseccion && !enfocado ? <Text style={styles.subnavTitulo}>{subseccion.titulo}</Text> : null}

      <View style={styles.cuerpo}>
        {reclamarId ? (
          <ReclamarScreen
            publicacionId={reclamarId}
            onVolver={() => setReclamarId(null)}
            onEnviado={() => irA('reclamos')}
          />
        ) : perfilId ? (
          <PublicProfileScreen usuarioId={perfilId} onVolver={() => setPerfilId(null)} />
        ) : detalleId ? (
          <DetalleScreen
            publicacionId={detalleId}
            onVolver={volverDelDetalle}
            onAbrirPerfil={setPerfilId}
            onIrA={irA}
            onReclamar={(publicacion) => setReclamarId(publicacion.id)}
          />
        ) : (
          <Componente
            key={actual}
            onAbrirPublicacion={setDetalleId}
            onAbrirPerfil={setPerfilId}
            onNovedadesVistas={novedades.recargar}
            onIrA={irA}
            novedades={novedades}
            busquedaInicial={busquedaAlerta}
            onVerResultados={(alerta) => irA('buscar', { filtros: filtrosDesdeAlerta(alerta) })}
          />
        )}
      </View>

      <View style={styles.barra}>
          {TABS.map((tab) => {
            const activa = tab.clave === seccion;
            const cuenta = tab.clave === 'actividad' ? novedadesActividad : 0;
            const Icono = tab.Icono;
            return (
              <Pressable key={tab.clave} style={[styles.tab, activa && styles.tabActiva]} onPress={() => irA(tab.clave)}>
                <Icono color={activa ? COLORS.primary : COLORS.muted} />
                <View style={styles.tabFila}>
                  <Text style={[styles.tabTexto, activa && styles.tabTextoActiva]}>{tab.titulo}</Text>
                  {cuenta > 0 ? <Badge texto={cuenta > 9 ? '9+' : String(cuenta)} /> : null}
                </View>
              </Pressable>
            );
          })}
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function TituloLogo() {
  return <LogoApp size={30} />;
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <View style={styles.marcaBar}>
          <View style={styles.lado} />
          <LogoApp size={34} />
          <View style={styles.lado} />
        </View>
        <View style={styles.loaderCentro}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerShadowVisible: false,
            headerTintColor: COLORS.primary,
            headerTitleAlign: 'center',
            headerTitle: TituloLogo,
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: '' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ConexionProvider>
        <AuthProvider>
          <ProfileProvider>
            <RootNavigator />
          </ProfileProvider>
        </AuthProvider>
      </ConexionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cuerpo: { flex: 1 },
  loader: { flex: 1, backgroundColor: COLORS.background },
  loaderCentro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  marcaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  lado: { flex: 1 },
  volver: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  subnavTitulo: { color: COLORS.text, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  barra: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 16 },
  tabActiva: { backgroundColor: COLORS.primarySoft },
  tabFila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabTexto: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  tabTextoActiva: { color: COLORS.primary, fontWeight: '800' },
});
