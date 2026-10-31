// Constantes globales de la app. Un solo lugar para no repetir "magic strings".
// Recordatorio:
// - Dispositivo físico con Expo Go en la misma red Wi-Fi: 'http://192.168.100.61:8080'
// - Simulador iOS / Web en la misma Mac: 'http://localhost:8080'
// - Emulador de Android: 'http://10.0.2.2:8080'
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.61:8080';

export const STORAGE_KEYS = {
  TOKEN: 'hallado_token',
};

export const COLORS = {
  primary: '#2563eb',
  text: '#111827',
  muted: '#6b7280',
  border: '#d1d5db',
  danger: '#dc2626',
  background: '#ffffff',
};