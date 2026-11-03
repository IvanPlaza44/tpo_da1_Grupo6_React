import { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../navigation/AppNavigator';

export default function BuscarFlow({ onAbrirPublicacion, onIrA, busquedaInicial }) {
  const navegacion = useRef(null);

  return (
    <NavigationContainer
      ref={navegacion}
      onReady={() => {
        if (busquedaInicial) {
          navegacion.current?.navigate('Resultados', { filtros: busquedaInicial });
        }
      }}
    >
      <AppNavigator onAbrirPublicacion={onAbrirPublicacion} onIrA={onIrA} />
    </NavigationContainer>
  );
}