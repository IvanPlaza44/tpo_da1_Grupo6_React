import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BuscadorScreen from '../screens/BuscadorScreen';
import ResultadosScreen from '../screens/ResultadosScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ onAbrirPublicacion, onIrA }) {
  return (
    <Stack.Navigator initialRouteName="Buscador">
      <Stack.Screen name="Buscador" component={BuscadorScreen} options={{ title: 'Buscar' }} />
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