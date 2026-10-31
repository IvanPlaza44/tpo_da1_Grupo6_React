# Hallado — App móvil (React Native + Expo)

TPO de Desarrollo de Aplicaciones I. App móvil que consume la API REST de `hallado-api`.

## Cómo correrla

```bash
npm install
npm run android     # modo túnel: sirve aunque el celular y la PC no estén en la misma red
# o:  npm start     # modo normal (misma red wifi)
```

Escaneá el QR con **Expo Go**. Versión: Expo SDK 54 (la misma que el proyecto de práctica del profe).

## Estructura de carpetas

```
components/   UI pura, sin lógica (botones, inputs, tarjetas)
screens/      Cada pantalla de navegación
navigation/   Stacks, tabs y routers
services/     Comunicación con la API REST (axios)
hooks/        Hooks reutilizables
context/      React Contexts (sesión, etc.)
store/        Estado global, si hiciera falta
utils/        Helpers (validaciones, formateo de fechas)
config/       Constantes (URL de la API, colores)
```

## Flujo de trabajo con ramas

Nadie commitea directo en `main`. Cada integrante trabaja en su rama y sube por Pull Request:

```bash
git checkout main && git pull
git checkout -b feature/<lo-que-desarrollo>
# ...trabajar y commitear...
git push -u origin feature/<lo-que-desarrollo>
# abrir el Pull Request hacia main en GitHub
```
