import { Alert } from 'react-native';

// Busca la pantalla en este navegador y en los de arriba (por si más adelante hay tabs).
const estaRegistrada = (navigation, pantalla) => {
  let actual = navigation;
  while (actual) {
    if (actual.getState()?.routeNames?.includes(pantalla)) return true;
    actual = actual.getParent();
  }
  return false;
};

// Navega solo si la pantalla existe. Si todavía no está armada, avisa en vez de romper la app.
export const irA = (navigation, pantalla, params) => {
  if (estaRegistrada(navigation, pantalla)) {
    navigation.navigate(pantalla, params);
  } else {
    Alert.alert('Próximamente', 'Esta pantalla todavía no está disponible.');
  }
};