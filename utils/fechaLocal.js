// Convierte un Date a "YYYY-MM-DD" usando la fecha LOCAL del celular.
// OJO: date.toISOString() usa UTC y en Argentina, de noche, daría el día siguiente.
export const aFechaISO = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};