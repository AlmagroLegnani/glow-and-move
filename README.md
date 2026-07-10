# Web Fitness

App de fitness full-stack: React (Vite) + Node/Express.

## Estructura

```
web-fitness/
├── frontend/   # React + Vite
└── backend/    # Node + Express (API REST)
```

## Cómo correrlo

**Backend**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Corre en `http://localhost:4000`.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Corre en `http://localhost:5173`.

## Endpoints disponibles

- `GET /api/health` — chequeo de estado
- `GET /api/workouts` — lista de rutinas
- `POST /api/workouts` — crear rutina (`{ "name": "...", "exercises": [...] }`)

## Próximos pasos

Ver `CLAUDE.md` para contexto del proyecto y pendientes (base de datos, autenticación, conexión frontend-backend).
