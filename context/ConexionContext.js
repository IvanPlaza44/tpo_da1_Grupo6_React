import { createContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const ConexionContext = createContext({ conectado: true });

// Escucha los cambios de red del celular y comparte "conectado" con toda la app.
export function ConexionProvider({ children }) {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    // addEventListener avisa cada vez que cambia la conexión y devuelve la función para dejar de escuchar.
    const dejarDeEscuchar = NetInfo.addEventListener((estado) => {
      // isInternetReachable puede ser null mientras se averigua: ahí confiamos en isConnected.
      const hayInternet = estado.isConnected && estado.isInternetReachable !== false;
      setConectado(Boolean(hayInternet));
    });
    return dejarDeEscuchar;
  }, []);

  return <ConexionContext.Provider value={{ conectado }}>{children}</ConexionContext.Provider>;
}