// "2026-10-31" o "2026-10-31T14:30:00" -> "31/10/2026".
// Se parte el string en vez de usar Date para no correr el día por la zona horaria.
export const formatearFecha = (iso) => {
  if (!iso) return '';
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};
