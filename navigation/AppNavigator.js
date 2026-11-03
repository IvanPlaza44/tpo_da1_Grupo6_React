import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../config';
import BuscadorScreen from '../screens/BuscadorScreen';
import ResultadosScreen from '../screens/ResultadosScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ onAbrirPublicacion, onIrA }) {
  return (
    <Stack.Navigator
      initialRouteName="Buscador"
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
        headerTintColor: COLORS.primary,
        headerTitleStyle: { color: COLORS.text, fontWeight: '700' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Buscador" options={{ headerShown: false }}>
        {(props) => <BuscadorScreen {...props} onIrA={onIrA} />}
      </Stack.Screen>
      <Stack.Screen name="Resultados" options={{ title: 'Resultados' }}>
        {(props) => (
          <ResultadosScreen
            {...props}
            onAbrirPublicacion={onAbrirPublicacion}
            onIrA={onIrA}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}