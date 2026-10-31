// Datos simulados compartidos por services/historial.js y services/valoraciones.js,
// para que valorar o agradecer se refleje en el historial. Viven en memoria.

export const PLAZO_VALORACION_DIAS = 7;

export const demora = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// Mismo formato que un error de axios, para que getErrorMessage lo lea igual.
export const errorMock = (status, mensaje) => Object.assign(new Error(mensaje), { response: { status, data: { mensaje } } });

const dosDigitos = (n) => String(n).padStart(2, '0');

// Fecha local "YYYY-MM-DDTHH:mm:ss", como manda Spring un LocalDateTime.
const aIsoLocal = (d) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}` +
  `T${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}:00`;

const haceDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return aIsoLocal(d);
};

const sumarDias = (iso, dias) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return d;
};

// rol: DEVOLVI (le devolví algo a su dueño) | RECUPERE (me devolvieron algo mío).
let casos = [
  {
    publicacionId: 201,
    rol: 'DEVOLVI',
    fechaDevolucion: haceDias(2),
    titulo: 'Billetera marrón',
    tipo: 'ENCONTRADO',
    categoria: 'DOCUMENTOS',
    fotoPrincipal: null,
    contraparte: { id: 31, nombre: 'Ana' },
    miValoracion: null,
    miAgradecimiento: null,
  },
  {
    publicacionId: 202,
    rol: 'RECUPERE',
    fechaDevolucion: haceDias(1),
    titulo: 'Mochila azul',
    tipo: 'PERDIDO',
    categoria: 'OTROS',
    fotoPrincipal: null,
    contraparte: { id: 32, nombre: 'Diego' },
    miValoracion: null,
    miAgradecimiento: null,
  },
  {
    publicacionId: 203,
    rol: 'RECUPERE',
    fechaDevolucion: haceDias(5),
    titulo: 'Perro Toby',
    tipo: 'PERDIDO',
    categoria: 'MASCOTAS',
    fotoPrincipal: null,
    contraparte: { id: 33, nombre: 'Sofía' },
    miValoracion: { positiva: true, comentario: '¡Súper amable!' },
    miAgradecimiento: { mensaje: 'Gracias por cuidarlo hasta que llegué.' },
  },
  {
    publicacionId: 204,
    rol: 'DEVOLVI',
    fechaDevolucion: haceDias(12),
    titulo: 'Llaves con llavero rojo',
    tipo: 'PERDIDO',
    categoria: 'LLAVES',
    fotoPrincipal: null,
    contraparte: { id: 34, nombre: 'Pablo' },
    miValoracion: null,
    miAgradecimiento: null,
  },
  {
    publicacionId: 205,
    rol: 'RECUPERE',
    fechaDevolucion: haceDias(20),
    titulo: 'Celular Samsung',
    tipo: 'ENCONTRADO',
    categoria: 'ELECTRONICA',
    fotoPrincipal: null,
    contraparte: { id: 35, nombre: 'Laura' },
    miValoracion: null,
    miAgradecimiento: null,
  },
];

let agradecimientos = [
  { id: 1, usuarioId: 33, autorNombre: 'Vos', mensaje: 'Gracias por cuidarlo hasta que llegué.', publicacionTitulo: 'Perro Toby', fecha: haceDias(5) },
  { id: 2, usuarioId: 33, autorNombre: 'Carla', mensaje: 'Me devolvió el DNI el mismo día.', publicacionTitulo: 'DNI', fecha: haceDias(40) },
];
let siguienteAgradecimientoId = 3;

// Campos que calcularía el backend a partir de la fecha de devolución.
const conDerivados = (caso) => {
  const limite = sumarDias(caso.fechaDevolucion, PLAZO_VALORACION_DIAS);
  const yaValore = caso.miValoracion !== null;
  const yaAgradeci = caso.miAgradecimiento !== null;
  return {
    ...caso,
    fechaLimiteValoracion: aIsoLocal(limite),
    yaValore,
    puedeValorar: !yaValore && Date.now() <= limite.getTime(),
    yaAgradeci,
    puedeAgradecer: caso.rol === 'RECUPERE' && !yaAgradeci,
  };
};

export const obtenerCasos = () => casos.map(conDerivados);

export const obtenerCaso = (publicacionId) => {
  const caso = casos.find((c) => c.publicacionId === publicacionId);
  return caso ? conDerivados(caso) : null;
};

export const actualizarCaso = (publicacionId, cambios) => {
  casos = casos.map((c) => (c.publicacionId === publicacionId ? { ...c, ...cambios } : c));
};

export const obtenerAgradecimientos = (usuarioId) =>
  agradecimientos.filter((a) => a.usuarioId === usuarioId).sort((a, b) => b.fecha.localeCompare(a.fecha));

export const agregarAgradecimiento = (agradecimiento) => {
  const nuevo = { ...agradecimiento, id: siguienteAgradecimientoId++, fecha: aIsoLocal(new Date()) };
  agradecimientos = [...agradecimientos, nuevo];
  return nuevo;
};
