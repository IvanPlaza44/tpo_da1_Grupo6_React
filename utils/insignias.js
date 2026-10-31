import { formatearFecha } from './fechas';

export const INSIGNIA_VECINO_SOLIDARIO = 'Vecino solidario';
export const META_DEVOLUCIONES_SOLIDARIO = 5;

// Verifica si el usuario alcanzó las 5 devoluciones concretadas para la insignia "Vecino solidario"
export const tieneInsigniaVecinoSolidario = (devolucionesConcretadas = 0) =>
  Number(devolucionesConcretadas) >= META_DEVOLUCIONES_SOLIDARIO;

// Devuelve la lista de insignias del usuario combinando las del backend con la regla de 5 devoluciones
export const obtenerInsigniasUsuario = ({
  devolucionesConcretadas = 0,
  insignias = [],
} = {}) => {
  const conjunto = new Set(Array.isArray(insignias) ? insignias : []);

  if (tieneInsigniaVecinoSolidario(devolucionesConcretadas)) {
    conjunto.add(INSIGNIA_VECINO_SOLIDARIO);
  }

  return Array.from(conjunto);
};

// Calcula el porcentaje de reputación positiva sobre el total de valoraciones
export const calcularResumenReputacion = ({
  valoracionesPositivas = 0,
  valoracionesNegativas = 0,
} = {}) => {
  const positivas = Number(valoracionesPositivas) || 0;
  const negativas = Number(valoracionesNegativas) || 0;
  const total = positivas + negativas;

  if (total === 0) {
    return {
      positivas: 0,
      negativas: 0,
      total: 0,
      porcentajePositivo: null,
      etiqueta: 'Sin calificaciones aún',
    };
  }

  const porcentajePositivo = Math.round((positivas / total) * 100);
  return {
    positivas,
    negativas,
    total,
    porcentajePositivo,
    etiqueta: `${porcentajePositivo}% positiva (${total} ${
      total === 1 ? 'valoración' : 'valoraciones'
    })`,
  };
};

// Formatea la antigüedad del usuario en la plataforma a partir de fechaAlta
export const formatearAntiguedad = (fechaAltaIso) => {
  if (!fechaAltaIso) return 'Miembro reciente';

  const fechaTexto = formatearFecha(fechaAltaIso);
  const alta = new Date(fechaAltaIso);
  if (Number.isNaN(alta.getTime())) {
    return `Miembro desde el ${fechaTexto}`;
  }

  const ahora = new Date();
  const diffMs = Math.max(0, ahora.getTime() - alta.getTime());
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (dias < 1) {
    return `Se unió hoy (${fechaTexto})`;
  }
  if (dias < 30) {
    return `Miembro hace ${dias} ${dias === 1 ? 'día' : 'días'} (desde ${fechaTexto})`;
  }

  const meses = Math.floor(dias / 30);
  if (meses < 12) {
    return `Miembro hace ${meses} ${meses === 1 ? 'mes' : 'meses'} (desde ${fechaTexto})`;
  }

  const anios = Math.floor(meses / 12);
  return `Miembro hace ${anios} ${anios === 1 ? 'año' : 'años'} (desde ${fechaTexto})`;
};
