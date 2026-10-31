import { useCallback, useEffect, useState } from 'react';
import { listarAlertas } from '../services/alertas';
import { listarSeguidas } from '../services/seguidas';

// Cuántas alertas activas tienen novedades y cuántas seguidas cambiaron de estado.
// Pensado para el badge de las pestañas (tabBarBadge). Si falla, deja el último valor.
export default function useNovedades() {
  const [novedades, setNovedades] = useState({ alertas: 0, seguidas: 0 });

  const recargar = useCallback(async () => {
    const [alertas, seguidas] = await Promise.allSettled([listarAlertas(), listarSeguidas()]);
    setNovedades((prev) => ({
      alertas:
        alertas.status === 'fulfilled'
          ? alertas.value.filter((a) => a.activa && a.hayNovedades).length
          : prev.alertas,
      seguidas:
        seguidas.status === 'fulfilled'
          ? seguidas.value.filter((p) => p.cambioEstado).length
          : prev.seguidas,
    }));
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { ...novedades, recargar };
}
