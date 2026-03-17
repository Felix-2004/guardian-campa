# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is the **Guardian Companion** personal safety app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Maps**: Leaflet + react-leaflet
- **Auth**: JWT + OTP (Twilio SMS or mock)

## Guardian Companion - App Description

A full-stack mobile-first personal safety and intelligent assistance system.

### Features
- Phone number + OTP authentication (JWT)
- First-time onboarding setup
- Dashboard with live Leaflet map, safety score, recommendations
- SOS button (press and hold 3s) with SMS alerts
- Emergency contacts management
- Safe locations with geofencing
- Alerts history with resolve
- Live tracking link for SOS sessions
- Stealth mode (calculator disguise, type "999=" for SOS)
- Offline mode with localStorage queue
- Family dashboard (public token-based)
- Safety score engine (0-100)
- Rule-based recommendation system
- Audio recording on SOS
- Dark/light mode + accessibility large text

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── guardian-companion/ # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema
- `users` - User accounts with phone, name, issues, preferences, familyToken
- `contacts` - Emergency contacts (name, phone, relationship, priority)
- `safe_locations` - Named locations with lat/lng and radius
- `alerts` - SOS and other alerts with status/location/trackingSessionId
- `tracking_sessions` - Live location tracking for SOS events

## API Routes (all under /api)
- `/auth/request-otp` - Send OTP via Twilio (or mock)
- `/auth/verify-otp` - Verify OTP, return JWT
- `/users/me` GET/PUT - Get/update user profile
- `/users/setup` POST - Complete onboarding
- `/contacts` CRUD - Emergency contacts
- `/locations` CRUD - Safe locations
- `/alerts` GET/POST + `/alerts/:id/resolve`
- `/tracking/:sessionId` GET/POST - Live tracking
- `/safety/score` + `/safety/recommendations`
- `/family/dashboard?token=xxx` - Family dashboard

## Environment Variables
Required:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `JWT_SECRET` - JWT signing secret (defaults to dev value if not set)

Optional (for real SMS):
- `TWILIO_SID` - Twilio Account SID
- `TWILIO_TOKEN` - Twilio Auth Token  
- `TWILIO_PHONE` - Twilio phone number
- `APP_URL` - Base URL for tracking links

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.
