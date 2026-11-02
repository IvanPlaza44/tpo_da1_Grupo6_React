import { Linking } from 'react-native';
import api from './api';

// Punto de encuentro de un reclamo aceptado (Punto 8).
// - La primera propuesta la hace quien tiene el objeto.
// - La otra parte la acepta o propone otro lugar (la anterior queda REEMPLAZADA).
// El backend devuelve siempre el "encuentro": punto vigente (o null) + puedoProponer / puedoAceptar.
// contraparteTelefono solo viene si la otra persona eligió mostrar su teléfono (Punto 2).
//
// EXPO_PUBLIC_MOCKS=true simula todo (sirve sin backend ni login).
const MODO_MOCK = process.env.EXPO_PUBLIC_MOCKS;
const SOLO_MOCKS = ['true', 'vacio', 'error'].includes(MODO_MOCK);

const demora = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// Mismo formato que un error de axios, para que getErrorMessage lo lea igual.
const errorMock = (status, mensaje) => Object.assign(new Error(mensaje), { response: { status, data: { mensaje } } });

const dosDigitos = (n) => String(n).padStart(2, '0');
const aIsoLocal = (d) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}` +
  `T${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}:00`;
const haceHoras = (horas) => aIsoLocal(new Date(Date.now() - horas * 3600000));

// Reclamo 2 de los mocks ("Gata gris perdida", en Enviados): vos tenés a la gata,
// propusiste un lugar y Martín respondió proponiendo otro. Martín muestra su teléfono.
// Sirve para probar aceptar, contraproponer y el teléfono visible.
const mockEncuentros = {
  2: {
    publicacionId: 11,
    publicacionTitulo: 'Gata gris perdida',
    tengoElObjeto: true,
    contraparteNombre: 'Martín',
    contraparteTelefono: '11 5555-1234',
    puntos: [
      {
        id: 1,
        direccion: 'Plaza 24 de Septiembre, Villa Crespo',
        latitud: -34.5965,
        longitud: -58.441,
        indicaciones: 'Viernes 18 h',
        estado: 'REEMPLAZADO',
        propuestoPorMi: true,
        propuestoPorNombre: 'Vos',
        fechaCreacion: haceHoras(6),
      },
      {
        id: 2,
        direccion: 'Av. Corrientes 5000, Villa Crespo',
        latitud: -34.5986,
        longitud: -58.4372,
        indicaciones: 'Sábado 11 h, en la puerta del supermercado',
        estado: 'PROPUESTO',
        propuestoPorMi: false,
        propuestoPorNombre: 'Martín',
        fechaCreacion: haceHoras(2),
      },
    ],
  },
};
let mockSiguienteId = 100;

// Cualquier otro reclamo aceptado (por ejemplo, el que aceptes en "Recibidos"):
// vos tenés el objeto, todavía nadie propuso y la otra persona no muestra su teléfono.
const encuentroMock = (reclamoId) => {
  if (!mockEncuentros[reclamoId]) {
    mockEncuentros[reclamoId] = {
      publicacionId: null,
      publicacionTitulo: null,
      tengoElObjeto: true,
      contraparteNombre: 'la otra persona',
      contraparteTelefono: null,
      puntos: [],
    };
  }
  return mockEncuentros[reclamoId];
};

// Misma lógica que PuntoEncuentroService.aDto en el backend.
const aDto = (reclamoId, encuentro) => {
  const vigente = [...encuentro.puntos].reverse().find((p) => p.estado !== 'REEMPLAZADO') || null;
  const propuestaDelOtro = Boolean(vigente && vigente.estado === 'PROPUESTO' && !vigente.propuestoPorMi);
  return {
    reclamoId,
    publicacionId: encuentro.publicacionId,
    publicacionTitulo: encuentro.publicacionTitulo,
    tengoElObjeto: encuentro.tengoElObjeto,
    contraparteNombre: encuentro.contraparteNombre,
    contraparteTelefono: encuentro.contraparteTelefono ?? null,
    punto: vigente,
    puedoProponer: vigente ? propuestaDelOtro : encuentro.tengoElObjeto,
    puedoAceptar: propuestaDelOtro,
  };
};

export const obtenerEncuentro = async (reclamoId) => {
  if (SOLO_MOCKS) {
    await demora();
    if (MODO_MOCK === 'error') throw new Error('Error simulado');
    return aDto(reclamoId, encuentroMock(reclamoId));
  }
  const { data } = await api.get(`/api/reclamos/${reclamoId}/punto-encuentro`);
  return data;
};

// propuesta: { direccion, latitud, longitud, indicaciones }. Hace falta dirección o ubicación.
export const proponerPunto = async (reclamoId, propuesta) => {
  const body = {
    direccion: propuesta.direccion?.trim() || null,
    latitud: propuesta.latitud ?? null,
    longitud: propuesta.longitud ?? null,
    indicaciones: propuesta.indicaciones?.trim() || null,
  };

  if (SOLO_MOCKS) {
    await demora();
    const encuentro = encuentroMock(reclamoId);
    const actual = aDto(reclamoId, encuentro);
    if (!actual.puedoProponer) {
      throw errorMock(
        400,
        actual.punto
          ? 'Esperá a que la otra persona responda tu propuesta'
          : 'El punto de encuentro lo propone quien tiene el objeto'
      );
    }
    if (!body.direccion && (body.latitud == null || body.longitud == null)) {
      throw errorMock(400, 'Indicá una dirección o usá tu ubicación actual');
    }
    encuentro.puntos = encuentro.puntos.map((p) => (p.estado === 'PROPUESTO' ? { ...p, estado: 'REEMPLAZADO' } : p));
    encuentro.puntos.push({
      id: mockSiguienteId++,
      ...body,
      estado: 'PROPUESTO',
      propuestoPorMi: true,
      propuestoPorNombre: 'Vos',
      fechaCreacion: aIsoLocal(new Date()),
    });
    return aDto(reclamoId, encuentro);
  }

  const { data } = await api.post(`/api/reclamos/${reclamoId}/punto-encuentro`, body);
  return data;
};

export const aceptarPunto = async (reclamoId, puntoId) => {
  if (SOLO_MOCKS) {
    await demora();
    const encuentro = encuentroMock(reclamoId);
    const punto = encuentro.puntos.find((p) => p.id === puntoId);
    if (!punto || punto.estado !== 'PROPUESTO') throw errorMock(400, 'Esta propuesta ya no está vigente');
    if (punto.propuestoPorMi) throw errorMock(400, 'No podés aceptar tu propia propuesta');
    punto.estado = 'ACEPTADO';
    return aDto(reclamoId, encuentro);
  }
  const { data } = await api.patch(`/api/reclamos/${reclamoId}/punto-encuentro/${puntoId}/aceptar`);
  return data;
};

// "Cómo llegar": abre Google Maps (o el navegador si no está instalada) con el destino
// precargado y en modo navegación. Usa las coordenadas si las hay; si no, la dirección.
export const abrirComoLlegar = async (punto) => {
  const tieneCoordenadas = punto.latitud != null && punto.longitud != null;
  const destino = tieneCoordenadas ? `${punto.latitud},${punto.longitud}` : punto.direccion;
  const url =
    'https://www.google.com/maps/dir/?api=1' +
    `&destination=${encodeURIComponent(destino)}` +
    '&travelmode=driving&dir_action=navigate';
  await Linking.openURL(url);
};