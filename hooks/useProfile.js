import { useContext } from 'react';
import { ProfileContext } from '../context/ProfileContext';

export const useProfile = () => {
  const context = useContext(ProfileContext);

  if (context === undefined) {
    throw new Error('useProfile debe ser utilizado dentro de un ProfileProvider');
  }

  return context;
};
