# Web Fitness

App full-stack de fitness. Frontend en React (Vite), backend en Node/Express.

## Estructura

- `frontend/` — SPA en React creada con Vite. Entrada en `src/main.jsx`, componente raíz en `src/App.jsx`.
  - Landing de una sola página con scroll: `Navbar`, `Hero` (#home), `StatsBar`, `About` (#nosotros, tarjetas de programas), `Contact` (#contacto), `Footer`, en `src/components/`.
  - Paleta de colores soft-neutral definida como CSS custom properties en `src/index.css`: cream, beige, taupe, mocha, mocha-deep, sage, blush. Tipografías: Fraunces (serif, para títulos de Contacto) + Manrope (sans, headline hero/nav/tarjetas en mayúsculas bold), cargadas en `index.html`.
  - Animaciones de scroll-reveal vía `src/hooks/useReveal.js` (IntersectionObserver) con fallback nativo a `animation-timeline: view()` en navegadores compatibles.
  - Fotos en `src/assets/photos/` (`hero.jpg`, `about-1.jpg`, `about-2.jpg`, `story.jpg`, `contact.jpg`): son placeholders con gradientes en la paleta de marca. Reemplazar por fotos reales manteniendo el mismo nombre de archivo.
- `backend/` — API REST en Express. Entrada en `src/server.js`, rutas en `src/routes/`, lógica en `src/controllers/`. Sin base de datos todavía (datos en memoria).

## Comandos

Backend:
```
cd backend
npm install
cp .env.example .env
npm run dev      # nodemon, puerto 4000
```

Frontend:
```
cd frontend
npm install
npm run dev       # Vite dev server, puerto 5173
```

## Convenciones

- Backend usa CommonJS (`require`/`module.exports`).
- Rutas de API bajo `/api/*` (ej. `/api/workouts`, `/api/health`).
- Frontend consume la API vía `fetch` a `http://localhost:4000` (configurar proxy o variable de entorno cuando se agregue).

## Pendiente / próximos pasos

- Elegir base de datos (ej. MongoDB, PostgreSQL) y reemplazar el almacenamiento en memoria de `workoutController.js`.
- Definir modelo de datos de usuarios/rutinas/ejercicios.
- Autenticación (ej. JWT).
- Conectar frontend con la API real.
