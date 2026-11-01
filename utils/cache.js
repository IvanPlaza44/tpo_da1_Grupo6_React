import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIJO = 'hallado_cache:';

// Guarda cualquier dato (se convierte a texto JSON) junto con el momento en que se guardó.
export const guardarCache = async (clave, datos) => {
  try {
    await AsyncStorage.setItem(PREFIJO + clave, JSON.stringify({ datos, guardadoEn: Date.now() }));
  } catch (error) {
    // La caché es una ayuda: si falla, la app sigue funcionando igual.
  }
};

export const leerCache = async (clave) => {
  try {
    const texto = await AsyncStorage.getItem(PREFIJO + clave);
    return texto ? JSON.parse(texto) : null;
  } catch (error) {
    return null;
  }
};

// Borra toda la caché (se usa al cerrar sesión, para no mezclar datos entre usuarios).
export const limpiarCache = async () => {
  try {
    const claves = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(claves.filter((c) => c.startsWith(PREFIJO)));
  } catch (error) {
    // idem
  }
};

// Pide los datos a la red. Si anda: los guarda y los devuelve frescos.
// Si NO hay conexión (el error no trae respuesta del servidor): devuelve lo último guardado.
// Si el servidor respondió con un error (401, 500...) se propaga: eso no es un problema de conexión.
export const conCache = async (clave, pedir) => {
  try {
    const datos = await pedir();
    await guardarCache(clave, datos);
    return { datos, desactualizado: false, guardadoEn: Date.now() };
  } catch (error) {
    if (!error.response) {
      const guardado = await leerCache(clave);
      if (guardado) {
        return { datos: guardado.datos, desactualizado: true, guardadoEn: guardado.guardadoEn };
      }
    }
    throw error;
  }
};