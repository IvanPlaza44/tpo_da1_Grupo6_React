import AsyncStorage from '@react-native-async-storage/async-storage';

// Las últimas búsquedas no son datos sensibles: van en AsyncStorage (no en SecureStore).
const CLAVE = 'hallado_ultimas_busquedas';
const MAXIMO = 5;

export const obtenerBusquedasRecientes = async () => {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE);
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    return [];
  }
};

// Guarda la búsqueda arriba de todo, sin repetirla, y se queda con las últimas 5.
export const guardarBusquedaReciente = async (filtros) => {
  const actuales = await obtenerBusquedasRecientes();
  const texto = JSON.stringify(filtros);
  const sinRepetida = actuales.filter((f) => JSON.stringify(f) !== texto);
  const nuevas = [filtros, ...sinRepetida].slice(0, MAXIMO);
  await AsyncStorage.setItem(CLAVE, JSON.stringify(nuevas));
  return nuevas;
};