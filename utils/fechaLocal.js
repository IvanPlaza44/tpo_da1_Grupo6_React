// Convierte un Date a "YYYY-MM-DD" usando la fecha LOCAL del celular.
// OJO: date.toISOString() usa UTC y en Argentina, de noche, daría el día siguiente.
export const aFechaISO = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
// "2026-11-01" -> Date local (sin el corrimiento de zona horaria de new Date("2026-11-01"))
export const parseFechaISO = (texto) => {
  const [y, m, d] = texto.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// "14:30:00" -> Date de hoy con esa hora
export const parseHora = (texto) => {
  const [h, min] = texto.split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(h, min, 0, 0);
  return fecha;
};

// Date -> "14:30"
export const aHoraISO = (fecha) =>
  `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;

// El backend también guarda la franja; la calculamos desde la hora elegida.
export const franjaDeHora = (fecha) => {
  const h = fecha.getHours();
  if (h < 12) return 'MANANA';
  if (h < 20) return 'TARDE';
  return 'NOCHE';
};