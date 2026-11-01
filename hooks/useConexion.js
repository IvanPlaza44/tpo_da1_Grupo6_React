import { useContext } from 'react';
import { ConexionContext } from '../context/ConexionContext';

// Uso en cualquier pantalla: const { conectado } = useConexion();
export const useConexion = () => useContext(ConexionContext);