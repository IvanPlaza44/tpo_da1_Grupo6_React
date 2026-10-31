import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  obtenerMiPerfil,
  actualizarMiPerfil,
  subirFotoPerfil,
} from '../services/usuarios';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return null;
    }

    try {
      setLoadingProfile(true);
      const data = await obtenerMiPerfil();
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error.response?.data || error.message);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const updateProfile = async (datosPerfil) => {
    const actualizado = await actualizarMiPerfil(datosPerfil);
    setProfile(actualizado);
    return actualizado;
  };

  const updateProfilePhoto = async (imageAsset) => {
    const actualizado = await subirFotoPerfil(imageAsset);
    setProfile(actualizado);
    return actualizado;
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loadingProfile,
        refreshProfile,
        updateProfile,
        updateProfilePhoto,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
