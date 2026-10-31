// "2026-10-31" o "2026-10-31T14:30:00" -> "31/10/2026".
// Se parte el string en vez de usar Date para no correr el día por la zona horaria.
export const formatearFecha = (iso) => {
  if (!iso) return '';
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

const dosDigitos = (n) => String(n).padStart(2, '0');

// Date -> "YYYY-MM-DD" en hora local (el formato de LocalDate que espera el backend).
export const aFechaIso = (fecha) =>
  `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;

// "YYYY-MM-DD" -> Date a las 00:00 hora local.
export const desdeFechaIso = (iso) => {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};
