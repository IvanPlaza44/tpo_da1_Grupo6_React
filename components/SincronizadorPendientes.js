import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useConexion } from '../hooks/useConexion';
import { procesarPendientes } from '../services/colaPendientes';

// No dibuja nada. Cada vez que hay conexión (o al abrir la app con sesión), envía la cola.
export default function SincronizadorPendientes() {
  const { user } = useAuth();
  const { conectado } = useConexion();

  useEffect(() => {
    if (!conectado || !user?.usuarioId) return;
    const sincronizar = async () => {
      const { enviadas, conError } = await procesarPendientes(user.usuarioId);
      if (enviadas > 0) {
        Alert.alert(
          'Publicaciones enviadas',
          enviadas === 1
            ? 'Se publicó la publicación que estaba pendiente de envío.'
            : `Se publicaron ${enviadas} publicaciones que estaban pendientes de envío.`
        );
      }
      if (conError > 0) {
        Alert.alert('Atención', 'El servidor rechazó alguna publicación pendiente. Revisala en Mis publicaciones.');
      }
    };
    sincronizar();
  }, [conectado, user?.usuarioId]);

  return null;
}