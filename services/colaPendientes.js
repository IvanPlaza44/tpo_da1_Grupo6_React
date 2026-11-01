import AsyncStorage from '@react-native-async-storage/async-storage';
import { getErrorMessage } from './api';
import {
  actualizarPublicacion,
  crearPublicacion,
  publicarPublicacion,
  subirFoto,
} from './publicaciones';

// Cola de publicaciones creadas sin conexión. Una cola por usuario (la clave lleva su id).
const clave = (userId) => `hallado_pendientes:${userId}`;

// Mini sistema de avisos: las pantallas se suscriben y se enteran cuando la cola cambia.
const oyentes = new Set();
const avisar = () => oyentes.forEach((fn) => fn());
export const suscribirCambios = (fn) => {
  oyentes.add(fn);
  return () => oyentes.delete(fn); // devuelve la función para desuscribirse
};

export const leerPendientes = async (userId) => {
  try {
    const texto = await AsyncStorage.getItem(clave(userId));
    return texto ? JSON.parse(texto) : [];
  } catch (error) {
    return [];
  }
};

const guardar = async (userId, lista) => {
  await AsyncStorage.setItem(clave(userId), JSON.stringify(lista));
  avisar();
};

export const agregarPendiente = async (userId, item) => {
  const lista = await leerPendientes(userId);
  await guardar(userId, [...lista, item]);
};

export const quitarPendiente = async (userId, idLocal) => {
  const lista = await leerPendientes(userId);
  await guardar(userId, lista.filter((i) => i.idLocal !== idLocal));
};

const reemplazarPendiente = async (userId, item) => {
  const lista = await leerPendientes(userId);
  await guardar(userId, lista.map((i) => (i.idLocal === item.idLocal ? item : i)));
};

// Envía UNA publicación al servidor, paso por paso. Cada paso es repetible sin romper nada:
//   1) crea el borrador (solo si todavía no existe)  2) completa los datos
//   3) sube las fotos que falten                     4) publica
// alProgresar se llama cada vez que se avanza, para guardar hasta dónde llegó.
export const procesarItem = async (item, alProgresar) => {
  const progreso = { ...item, fotosSubidas: [...(item.fotosSubidas || [])] };
  const avanzar = async () => {
    if (alProgresar) await alProgresar({ ...progreso, fotosSubidas: [...progreso.fotosSubidas] });
  };

  if (!progreso.publicacionId) {
    const creada = await crearPublicacion({ tipo: progreso.tipo });
    progreso.publicacionId = creada.id;
    await avanzar();
  }

  await actualizarPublicacion(progreso.publicacionId, progreso.datos);

  for (const foto of progreso.fotos) {
    if (!progreso.fotosSubidas.includes(foto.uri)) {
      await subirFoto(progreso.publicacionId, foto);
      progreso.fotosSubidas.push(foto.uri);
      await avanzar();
    }
  }

  await publicarPublicacion(progreso.publicacionId);
  return progreso;
};

// Evita que dos sincronizaciones corran a la vez.
let procesando = false;

// Envía toda la cola. Devuelve cuántas se enviaron y cuántas rechazó el servidor.
export const procesarPendientes = async (userId) => {
  if (procesando) return { enviadas: 0, conError: 0 };
  procesando = true;
  let enviadas = 0;
  let conError = 0;
  try {
    const lista = await leerPendientes(userId);
    for (const item of lista) {
      if (item.error) continue; // las que el servidor rechazó esperan a que la persona las descarte
      try {
        await procesarItem(item, (p) => reemplazarPendiente(userId, p));
        await quitarPendiente(userId, item.idLocal);
        enviadas += 1;
      } catch (error) {
        if (!error.response) break; // se cortó la red: se reintenta cuando vuelva
        // El servidor respondió con un error (por ejemplo, datos inválidos): se marca para mostrarlo.
        const actual = (await leerPendientes(userId)).find((i) => i.idLocal === item.idLocal) || item;
        await reemplazarPendiente(userId, { ...actual, error: getErrorMessage(error) });
        conError += 1;
      }
    }
  } finally {
    procesando = false;
  }
  return { enviadas, conError };
};