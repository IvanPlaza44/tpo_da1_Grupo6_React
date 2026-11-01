import api from './api';

// Reclamos (Punto 7).
// "Es mío" = reclamo sobre una publicación ENCONTRADO.
// "Lo encontré" = reclamo sobre una publicación PERDIDO.
// El backend deduce cuál es según el tipo de la publicación.
//
// EXPO_PUBLIC_MOCKS=true simula todo (sirve sin backend ni login).
// EXPO_PUBLIC_MOCKS=vacio | error simula todo y fuerza ese resultado en los listados.
// PENDIENTE marca lo que el backend todavía no tiene: queda simulado aunque se use
// el backend real. Pasar a false cuando el endpoint exista.
const MODO_MOCK = process.env.EXPO_PUBLIC_MOCKS;
const SOLO_MOCKS = ['true', 'vacio', 'error'].includes(MODO_MOCK);
const PENDIENTE = {
  listar: true, // GET /reclamos/enviados y /reclamos/recibidos
  foto: true, // POST /reclamos/{id}/foto
};

export const MAX_INTENTOS = 3;
export const HORAS_VENCIMIENTO = 48;

const demora = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// Mismo formato que un error de axios, para que getErrorMessage lo lea igual.
const errorMock = (status, mensaje) => Object.assign(new Error(mensaje), { response: { status, data: { mensaje } } });

const dosDigitos = (n) => String(n).padStart(2, '0');
// Fecha local "YYYY-MM-DDTHH:mm:ss", como manda Spring un LocalDateTime.
const aIsoLocal = (d) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}` +
  `T${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}:00`;
const haceHoras = (horas) => aIsoLocal(new Date(Date.now() - horas * 3600000));
const sumarHoras = (iso, horas) => aIsoLocal(new Date(new Date(iso).getTime() + horas * 3600000));

// Misma forma que tendrá ReclamoResponseDto en el backend.
// respuestaVerificacion solo la recibe el publicador (en "recibidos").
let mockEnviados = [
  {
    id: 1,
    publicacionId: 10,
    publicacionTitulo: 'DNI encontrado en plaza',
    publicacionTipo: 'ENCONTRADO',
    mensaje: 'Lo perdí el martes volviendo del trabajo.',
    respuestaVerificacion: null,
    barrio: null,
    fotoUrl: null,
    estado: 'PENDIENTE',
    fechaCreacion: haceHoras(5),
  },
  {
    id: 2,
    publicacionId: 11,
    publicacionTitulo: 'Gata gris perdida',
    publicacionTipo: 'PERDIDO',
    mensaje: 'Estaba en el patio de mi edificio.',
    respuestaVerificacion: null,
    barrio: 'Villa Crespo',
    fotoUrl: null,
    estado: 'ACEPTADO',
    fechaCreacion: haceHoras(30),
  },
  {
    id: 3,
    publicacionId: 12,
    publicacionTitulo: 'Llaves con llavero rojo',
    publicacionTipo: 'ENCONTRADO',
    mensaje: null,
    respuestaVerificacion: null,
    barrio: null,
    fotoUrl: null,
    estado: 'RECHAZADO',
    fechaCreacion: haceHoras(72),
  },
];

let mockRecibidos = [
  {
    id: 101,
    publicacionId: 20,
    publicacionTitulo: 'Billetera marrón',
    publicacionTipo: 'ENCONTRADO',
    reclamanteId: 31,
    reclamanteNombre: 'Ana',
    mensaje: 'Tiene una foto carnet adentro.',
    respuestaVerificacion: 'Tiene un sticker de un gato',
    barrio: null,
    fotoUrl: null,
    estado: 'PENDIENTE',
    fechaCreacion: haceHoras(2),
  },
  {
    id: 102,
    publicacionId: 20,
    publicacionTitulo: 'Billetera marrón',
    publicacionTipo: 'ENCONTRADO',
    reclamanteId: 32,
    reclamanteNombre: 'Diego',
    mensaje: null,
    respuestaVerificacion: 'Es negra',
    barrio: null,
    fotoUrl: null,
    estado: 'PENDIENTE',
    fechaCreacion: haceHoras(40),
  },
  {
    id: 103,
    publicacionId: 21,
    publicacionTitulo: 'Perro Toby',
    publicacionTipo: 'PERDIDO',
    reclamanteId: 33,
    reclamanteNombre: 'Sofía',
    mensaje: 'Lo tengo en casa, está bien.',
    respuestaVerificacion: null,
    barrio: 'Caballito',
    fotoUrl: null,
    estado: 'PENDIENTE',
    fechaCreacion: haceHoras(50), // ya pasó el plazo: se ve como VENCIDO
  },
];
let mockSiguienteId = 200;

// Campos que calcula el backend: vencimiento a las 48 h y estado VENCIDO.
const conDerivados = (reclamo) => {
  const fechaVencimiento = reclamo.fechaVencimiento ?? sumarHoras(reclamo.fechaCreacion, HORAS_VENCIMIENTO);
  const vencido = reclamo.estado === 'PENDIENTE' && Date.now() > new Date(fechaVencimiento).getTime();
  return { ...reclamo, fechaVencimiento, estado: vencido ? 'VENCIDO' : reclamo.estado };
};

const listarMock = async (lista) => {
  await demora();
  if (MODO_MOCK === 'error') throw new Error('Error simulado');
  if (MODO_MOCK === 'vacio') return [];
  return lista.map(conDerivados).sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
};

// "Mis reclamos": los que envié y los que recibí sobre mis publicaciones.
export const listarReclamosEnviados = async () => {
  if (SOLO_MOCKS || PENDIENTE.listar) return listarMock(mockEnviados);
  const { data } = await api.get('/api/reclamos/enviados');
  return data;
};

export const listarReclamosRecibidos = async () => {
  if (SOLO_MOCKS || PENDIENTE.listar) return listarMock(mockRecibidos);
  const { data } = await api.get('/api/reclamos/recibidos');
  return data;
};

// Crea el reclamo. Campos según el caso:
// - "Es mío":      { respuestaVerificacion (obligatoria), mensaje?, foto? }
// - "Lo encontré": { barrio (obligatorio), foto (obligatoria), mensaje? }
// publicacion: { id, titulo, tipo }. foto: asset de expo-image-picker (o null).
export const crearReclamo = async (publicacion, { mensaje, respuestaVerificacion, barrio, foto }) => {
  const body = {
    mensaje: mensaje?.trim() || null,
    respuestaVerificacion: respuestaVerificacion?.trim() || null,
    barrio: barrio?.trim() || null,
  };

  if (SOLO_MOCKS) {
    await demora();
    const intentos = mockEnviados.filter((r) => r.publicacionId === publicacion.id).length;
    if (intentos >= MAX_INTENTOS) {
      throw errorMock(409, `Ya hiciste ${MAX_INTENTOS} reclamos sobre esta publicación`);
    }
    if (mockEnviados.some((r) => r.publicacionId === publicacion.id && conDerivados(r).estado === 'PENDIENTE')) {
      throw errorMock(409, 'Ya tenés un reclamo pendiente sobre esta publicación');
    }
    const nuevo = {
      id: mockSiguienteId++,
      publicacionId: publicacion.id,
      publicacionTitulo: publicacion.titulo,
      publicacionTipo: publicacion.tipo,
      ...body,
      fotoUrl: foto?.uri ?? null,
      estado: 'PENDIENTE',
      fechaCreacion: aIsoLocal(new Date()),
    };
    mockEnviados = [nuevo, ...mockEnviados];
    return conDerivados(nuevo);
  }

  const { data: reclamo } = await api.post(`/api/publicaciones/${publicacion.id}/reclamos`, body);
  if (foto) return subirFotoReclamo(reclamo.id, foto);
  return reclamo;
};

// Sube la foto en multipart/form-data bajo el campo "archivo", igual que la foto de perfil.
export const subirFotoReclamo = async (reclamoId, foto) => {
  if (SOLO_MOCKS || PENDIENTE.foto) {
    await demora();
    return { id: reclamoId, fotoUrl: foto.uri };
  }
  const uri = foto.uri;
  const filename = foto.fileName || uri.split('/').pop() || `reclamo-${reclamoId}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = foto.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

  const formData = new FormData();
  formData.append('archivo', { uri, name: filename, type });

  const { data } = await api.post(`/api/reclamos/${reclamoId}/foto`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// Solo el publicador puede aceptar o rechazar. Aceptar uno rechaza los demás
// pendientes de la misma publicación (así lo hace PublicacionService).
// Mientras el listado sea simulado, aceptar/rechazar también lo es (los ids son del mock).
export const aceptarReclamo = async (publicacionId, reclamoId) => {
  if (SOLO_MOCKS || PENDIENTE.listar) {
    await demora();
    const reclamo = mockRecibidos.find((r) => r.id === reclamoId);
    if (!reclamo || conDerivados(reclamo).estado !== 'PENDIENTE') {
      throw errorMock(409, 'El reclamo ya no está pendiente');
    }
    mockRecibidos = mockRecibidos.map((r) => {
      if (r.id === reclamoId) return { ...r, estado: 'ACEPTADO' };
      if (r.publicacionId === publicacionId && r.estado === 'PENDIENTE') return { ...r, estado: 'RECHAZADO' };
      return r;
    });
    return;
  }
  const { data } = await api.patch(`/api/publicaciones/${publicacionId}/reclamos/${reclamoId}/aceptar`);
  return data;
};

export const rechazarReclamo = async (publicacionId, reclamoId) => {
  if (SOLO_MOCKS || PENDIENTE.listar) {
    await demora();
    mockRecibidos = mockRecibidos.map((r) => (r.id === reclamoId ? { ...r, estado: 'RECHAZADO' } : r));
    return;
  }
  const { data } = await api.patch(`/api/publicaciones/${publicacionId}/reclamos/${reclamoId}/rechazar`);
  return data;
};