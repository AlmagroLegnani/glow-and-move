# Glow & Move — Fitness membership platform

Full-stack web app for an online fitness studio: a public landing page, paid membership plans, member area with routines and training videos, an admin panel, and an AI assistant. Available in **Spanish, English and Portuguese**.

**Stack:** React 19 + Vite · Node.js + Express 5 · Prisma ORM + PostgreSQL · JWT · Mercado Pago · Resend · Google Gemini · Render · GitHub Actions

## Features

**Public site**
- One-page landing (hero, stats, programs, plans, contact form) with scroll-reveal animations
- Full i18n: ES / EN / PT
- Plans page with free trial signup and Mercado Pago checkout

**Members area**
- Sign up / log in with JWT, password reset by email
- My plan: subscription status, renewal and expiration notices
- My routine: weekly routine by day, exercise logging and progress per block
- My log: weight tracking and health profile
- My videos: training videos unlocked by plan, plus one-time purchase add-on services
- Profile with avatar picker

**Admin panel**
- Manage users, plans, subscriptions, routines, videos and add-on services
- Dashboard with key stats

**AI assistant**
- Chat assistant powered by Google Gemini that answers questions about the site in the user's language
- Automatic fallback to other Gemini models when the primary one is overloaded

**Automation**
- Daily GitHub Actions job that triggers plan-expiration notices (`POST /api/jobs/daily`, protected by a secret)
- Mercado Pago webhooks activate and extend subscriptions automatically

## Architecture

```
glow-and-move/
├── frontend/          React 19 SPA (Vite)
│   └── src/
│       ├── components/   pages and UI components
│       ├── context/      AuthContext (session state)
│       ├── i18n/         ES / EN / PT translations
│       └── lib/          API client and helpers
├── backend/           REST API (Express 5, CommonJS)
│   ├── prisma/        schema, migrations and seed
│   └── src/
│       ├── routes/       /api/* endpoints
│       ├── controllers/  business logic
│       ├── middleware/   auth (JWT) and roles
│       ├── jobs/         scheduled tasks (expirations)
│       └── lib/          email, Gemini, Mercado Pago
├── .github/workflows/ daily jobs
└── render.yaml        backend deployment (Render)
```

**Data model (Prisma / PostgreSQL):** User, Plan, Subscription, Payment, Routine, RoutineDay, RoutineExercise, DayExecution, ExerciseLog, Block, BlockProgress, Video, ExtraService, ServiceVideo, ServicePurchase, WeightLog, HealthProfile, ContactMessage, NotificationLog.

## Running locally

Requirements: Node.js 18+ and a PostgreSQL database.

```bash
# Backend (http://localhost:4000)
cd backend
npm install
cp .env.example .env      # set DATABASE_URL, JWT_SECRET and optional keys
npx prisma migrate dev
npm run dev

# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Secrets (database URL, JWT secret, Mercado Pago, Resend and Gemini keys) are read from environment variables and are never committed. See `backend/.env.example`.

## Deployment

- **Backend:** Render (`render.yaml`): installs, runs `prisma migrate deploy` and exposes `/api/health`.
- **Scheduled jobs:** GitHub Actions calls the daily endpoint with a shared secret.

## Development process

Built by [Leandro Almagro Legnani](https://github.com/AlmagroLegnani) using an AI-assisted workflow: I define the features, data model and architecture, and work with Claude Code as a pair-programming agent to implement, review and test each change in small commits.
