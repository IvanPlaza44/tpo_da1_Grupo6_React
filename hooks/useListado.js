import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';

// Carga un listado con una función async y expone sus estados.
// `cargar` tiene que ser estable (definida fuera del componente o con useCallback).
export default function useListado(cargar) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const ejecutar = useCallback(
    async ({ refresco = false } = {}) => {
      if (refresco) setRefrescando(true);
      else setCargando(true);
      setError(null);
      try {
        setDatos(await cargar());
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    [cargar]
  );

  useEffect(() => {
    ejecutar();
  }, [ejecutar]);

  return {
    datos,
    setDatos,
    cargando,
    refrescando,
    error,
    recargar: () => ejecutar(),
    refrescar: () => ejecutar({ refresco: true }),
  };
}
