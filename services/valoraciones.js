import api from './api';
import {
  PLAZO_VALORACION_DIAS,
  actualizarCaso,
  agregarAgradecimiento,
  demora,
  errorMock,
  obtenerAgradecimientos,
  obtenerCaso,
} from './mocks/historialMock';

// Valoraciones (/api/valoraciones) y agradecimientos públicos.
//
// EXPO_PUBLIC_MOCKS=true simula todo (sirve sin backend ni login).
// PENDIENTE marca lo que el backend todavía no tiene: queda simulado aunque se use
// el backend real. Pasar a false cuando el endpoint exista.
// El plazo de 7 días tampoco lo valida el backend todavía: con el backend real la app
// se guía por `puedeValorar` del historial.
const SOLO_MOCKS = ['true', 'vacio', 'error'].includes(process.env.EXPO_PUBLIC_MOCKS);
const PENDIENTE = {
  agradecimientos: true, // POST /agradecimientos y GET /usuarios/{id}/agradecimientos
};

const textoOpcional = (texto) => texto?.trim() || null;

// Mismas validaciones que ValoracionService, más el plazo.
const validarValoracionMock = (caso) => {
  if (!caso) throw errorMock(404, 'Publicación no encontrada');
  if (caso.yaValore) throw errorMock(409, 'Ya calificaste esta devolución');
  if (!caso.puedeValorar) {
    throw errorMock(400, `El plazo de ${PLAZO_VALORACION_DIAS} días para valorar ya venció`);
  }
};

export const valorar = async ({ publicacionId, positiva, comentario }) => {
  const body = { publicacionId, positiva, comentario: textoOpcional(comentario) };
  if (SOLO_MOCKS) {
    await demora();
    validarValoracionMock(obtenerCaso(publicacionId));
    actualizarCaso(publicacionId, { miValoracion: { positiva, comentario: body.comentario } });
    return;
  }
  await api.post('/api/valoraciones', body);
};

// Solo quien recuperó su objeto puede agradecer, una vez por devolución.
export const agradecer = async ({ publicacionId, mensaje }) => {
  if (SOLO_MOCKS || PENDIENTE.agradecimientos) {
    await demora();
    const caso = obtenerCaso(publicacionId);
    if (!caso) throw errorMock(404, 'Publicación no encontrada');
    if (caso.rol !== 'RECUPERE') throw errorMock(403, 'Solo quien recuperó su objeto puede agradecer');
    if (caso.yaAgradeci) throw errorMock(409, 'Ya dejaste un agradecimiento para esta devolución');
    const texto = textoOpcional(mensaje);
    if (!texto) throw errorMock(400, 'Escribí un mensaje de agradecimiento');
    actualizarCaso(publicacionId, { miAgradecimiento: { mensaje: texto } });
    return agregarAgradecimiento({
      usuarioId: caso.contraparte.id,
      autorNombre: 'Vos',
      mensaje: texto,
      publicacionTitulo: caso.titulo,
    });
  }
  const { data } = await api.post('/api/agradecimientos', { publicacionId, mensaje: textoOpcional(mensaje) });
  return data;
};

// Agradecimientos públicos que recibió un usuario (para su perfil).
// Cada uno: { id, autorNombre, mensaje, publicacionTitulo, fecha }
export const listarAgradecimientos = async (usuarioId) => {
  if (SOLO_MOCKS || PENDIENTE.agradecimientos) {
    await demora();
    return obtenerAgradecimientos(usuarioId);
  }
  const { data } = await api.get(`/api/usuarios/${usuarioId}/agradecimientos`);
  return data;
};
