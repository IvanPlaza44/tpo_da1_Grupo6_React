// Textos de la franja horaria (enum FranjaHoraria del backend).
export const FRANJAS = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
  NO_RECUERDO: 'No recuerdo',
};

// Convierte { CLAVE: 'Texto' } en [{ valor, label }] para el ChipSelector.
export const aOpciones = (obj) => Object.entries(obj).map(([valor, label]) => ({ valor, label }));