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
  primary: '#0F6E6B',
  primaryDark: '#0B5553',
  primarySoft: '#E5F3F2',
  text: '#1C1917',
  muted: '#78716C',
  border: '#E7E5E4',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  background: '#F6F4F1',
  surface: '#FFFFFF',
  perdido: '#C2410C',
  perdidoSoft: '#FFEDD5',
  encontrado: '#1D4ED8',
  encontradoSoft: '#DBEAFE',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  success: '#15803D',
  successSoft: '#DCFCE7',
  white: '#FFFFFF',
};

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const RADIUS = { sm: 10, md: 16, lg: 22, pill: 999 };