import api from './api';

// Solicita el envío de un código OTP para recuperar la contraseña
export const solicitarRecuperacionPassword = async (email) => {
  const response = await api.post('/api/auth/password/recuperar', {
    email: email.trim(),
  });
  return response.data;
};

// Reenvía el código OTP de recuperación si expiró o no llegó
export const reenviarRecuperacionPassword = async (email) => {
  const response = await api.post('/api/auth/password/recuperar/reenviar', {
    email: email.trim(),
  });
  return response.data;
};

// Restablece la contraseña validando el código OTP y guardando la nueva clave
export const restablecerPassword = async ({ email, codigo, passwordNueva }) => {
  const response = await api.post('/api/auth/password/restablecer', {
    email: email.trim(),
    codigo: codigo.trim(),
    passwordNueva,
  });
  return response.data;
};
