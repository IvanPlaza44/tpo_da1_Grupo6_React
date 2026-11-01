const RADIO_TIERRA_KM = 6371;
const aRadianes = (grados) => (grados * Math.PI) / 180;

// Distancia en km entre dos puntos (fórmula de Haversine).
export const distanciaKm = (lat1, lon1, lat2, lon2) => {
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(a));
};

// Ordena de más cerca a más lejos. Las publicaciones sin coordenadas van al final.
// ubicacion = { latitude, longitude } de la persona.
export const ordenarPorCercania = (lista, ubicacion) =>
  lista
    .map((item) => ({
      ...item,
      distanciaKm:
        item.latitud != null && item.longitud != null
          ? distanciaKm(ubicacion.latitude, ubicacion.longitude, item.latitud, item.longitud)
          : null,
    }))
    .sort((a, b) => {
      if (a.distanciaKm == null && b.distanciaKm == null) return 0;
      if (a.distanciaKm == null) return 1;
      if (b.distanciaKm == null) return -1;
      return a.distanciaKm - b.distanciaKm;
    });

export const formatoDistancia = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;