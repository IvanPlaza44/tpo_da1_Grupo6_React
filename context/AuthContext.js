import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import api, { setUnauthorizedHandler } from '../services/api';
import { saveToken, getToken, removeToken } from '../utils/storage';

export const AuthContext = createContext();

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_TOKEN_KEY = 'biometric_token';
const BIOMETRIC_USER_KEY = 'biometric_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasBiometricSession, setHasBiometricSession] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const bioFlag = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        const isBioEnabled = bioFlag === 'true';
        setBiometricEnabled(isBioEnabled);

        const bioToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
        const bioUser = await SecureStore.getItemAsync(BIOMETRIC_USER_KEY);
        setHasBiometricSession(Boolean(isBioEnabled && bioToken));

        const activeToken =
          (await getToken()) || (await SecureStore.getItemAsync('token'));
        const storedUser = await SecureStore.getItemAsync('user');

        if (activeToken) {
          if (isBioEnabled) {
            const authResult = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Desbloqueá tu sesión en Hallado',
              cancelLabel: 'Usar contraseña',
              fallbackLabel: 'Usar código del dispositivo',
            });

            if (authResult.success) {
              await saveToken(activeToken);
              setUser(storedUser ? JSON.parse(storedUser) : { token: activeToken });
            } else {
              setUser(null);
            }
          } else {
            await saveToken(activeToken);
            setUser(storedUser ? JSON.parse(storedUser) : { token: activeToken });
          }
        } else if (isBioEnabled && bioToken) {
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Desbloqueá tu sesión en Hallado',
            cancelLabel: 'Cancelar',
            fallbackLabel: 'Usar código del dispositivo',
          });

          if (authResult.success) {
            await saveToken(bioToken);
            await SecureStore.setItemAsync('token', bioToken);
            const parsedUser = bioUser ? JSON.parse(bioUser) : { token: bioToken };
            await SecureStore.setItemAsync('user', JSON.stringify(parsedUser));
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Error al recuperar la sesión de SecureStore:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    setUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        usernameOrEmail: email,
        password,
      });

      const data = response.data;
      const token = data.token;

      if (!token) {
        throw new Error('No se recibió un token JWT en la respuesta del servidor');
      }

      const userData = {
        usuarioId: data.usuarioId,
        email: data.email,
        username: data.username,
        token,
      };

      await saveToken(token);
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      if (biometricEnabled) {
        await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
        await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, JSON.stringify(userData));
        setHasBiometricSession(true);
      }

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error al iniciar sesión:', error.response?.data || error.message);
      throw error;
    }
  };

  const toggleBiometric = async (enable) => {
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: enable
          ? 'Confirmá tu identidad para activar la biometría'
          : 'Confirmá tu identidad para desactivar la biometría',
        cancelLabel: 'Cancelar',
      });

      if (!authResult.success) {
        return false;
      }

      if (enable) {
        const currentToken =
          user?.token ||
          (await getToken()) ||
          (await SecureStore.getItemAsync('token'));

        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        if (currentToken) {
          await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, currentToken);
        }
        if (user) {
          await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, JSON.stringify(user));
        }
        setBiometricEnabled(true);
        setHasBiometricSession(Boolean(currentToken));
      } else {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
        await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY);
        setBiometricEnabled(false);
        setHasBiometricSession(false);
      }

      return true;
    } catch (error) {
      console.error('Error al configurar biometría:', error);
      throw error;
    }
  };

  const loginWithBiometrics = async () => {
    try {
      const bioToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
      const bioUser = await SecureStore.getItemAsync(BIOMETRIC_USER_KEY);

      if (!bioToken) {
        throw new Error('No hay una sesión guardada con biometría.');
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloqueá tu sesión con huella o rostro',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar código del dispositivo',
      });

      if (!authResult.success) {
        return null;
      }

      const parsedUser = bioUser ? JSON.parse(bioUser) : { token: bioToken };
      await saveToken(bioToken);
      await SecureStore.setItemAsync('token', bioToken);
      await SecureStore.setItemAsync('user', JSON.stringify(parsedUser));
      setUser(parsedUser);
      return parsedUser;
    } catch (error) {
      console.error('Error en login biométrico:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión en SecureStore:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        biometricEnabled,
        hasBiometricSession,
        toggleBiometric,
        loginWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
