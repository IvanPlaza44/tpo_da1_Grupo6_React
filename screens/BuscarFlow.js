import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../navigation/AppNavigator';

export default function BuscarFlow({ onAbrirPublicacion, onIrA }) {
  return (
    <NavigationContainer>
      <AppNavigator onAbrirPublicacion={onAbrirPublicacion} onIrA={onIrA} />
    </NavigationContainer>
  );
}