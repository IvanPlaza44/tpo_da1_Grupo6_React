import AsyncStorage from '@react-native-async-storage/async-storage';

const clave = (userId) => `hallado_borrador_local:${userId}`;

// Las fechas son objetos Date: se guardan como número (milisegundos) y se reconstruyen al leer.
export const guardarBorradorLocal = async (userId, estado) => {
  try {
    const { form } = estado;
    const texto = JSON.stringify({
      ...estado,
      form: {
        ...form,
        fechaSuceso: form.fechaSuceso.getTime(),
        horaSuceso: form.horaSuceso.getTime(),
      },
      guardadoEn: Date.now(),
    });
    await AsyncStorage.setItem(clave(userId), texto);
  } catch (error) {
    // Es una ayuda: si falla, la carga sigue funcionando igual.
  }
};

export const leerBorradorLocal = async (userId) => {
  try {
    const texto = await AsyncStorage.getItem(clave(userId));
    if (!texto) return null;
    const dato = JSON.parse(texto);
    return {
      ...dato,
      form: {
        ...dato.form,
        fechaSuceso: new Date(dato.form.fechaSuceso),
        horaSuceso: new Date(dato.form.horaSuceso),
      },
    };
  } catch (error) {
    return null;
  }
};

export const borrarBorradorLocal = async (userId) => {
  try {
    await AsyncStorage.removeItem(clave(userId));
  } catch (error) {
    // idem
  }
};