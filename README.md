# Hotel Management System — Front Desk

A responsive hotel front desk dashboard built with React, Vite, Tailwind CSS v4, and Lucide icons. It supports room availability review, reservation lifecycle actions, and a quick-booking workflow.

## Highlights
- Front desk metrics for active reservations, available/occupied rooms and expected arrivals.
- Room grid with floor grouping, room status/type filters and room detail drawer.
- Quick booking form with guest details, date validation and live total estimate.
- Reservation status actions: confirm, cancel, check in and check out.
- Demo data by default, following the documented booking rules.
- Automated unit/UI tests, CI validation, production asset build, and GitHub Pages deployment workflow.

## Requirements
- Node.js 20+
- npm 10+

## Run locally
```bash
npm ci
npm test
npm run build
npm run dev
```

Open the Vite URL printed by the dev server.

## Demo vs live API
The app defaults to demo data, so the frontend can be previewed without a database:
```env
VITE_USE_MOCK=true
```

To use the Spring Boot API:
```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api/v1
``

The API host must implement the room, guest and booking endpoints expected by the UI. For a hosted static deployment, set `VITE_API_BASE_URL` to the deployed backend URL and enable the required CORS policy. Never put credentials or private secrets in Vite client-side environment variables.

## QA and deployment
- `npm test`: unit and UI tests.
- `npm run build`: production bundle.
- GitHub Actions `CI`: runs on pushes and pull requests.
- `Deploy frontend to GitHub Pages`: deploys frontend assets from `main`.

See [QA_EXECUTION.md](./QA_EXECUTION.md) for scope and limitations. In repository Settings → Pages, choose **GitHub Actions** as the build/deployment source if it is not already enabled.

## Backend API

A runnable Spring Boot API is now provided under `backend/` with Java 21, Spring Web, Validation, Spring Data JPA, PostgreSQL support, and an H2 default for local tests. Endpoints include:
- `GET /api/v1/health`
- `GET/POST /api/v1/rooms`
- `GET/POST /api/v1/guests`
- `GET/POST /api/v1/bookings`
- `PATCH /api/v1/bookings/{id}/status`

Run frontend + PostgreSQL + API locally with Docker Compose:

```bash
docker compose up --build
```

The API listens on `http://localhost:8080`; the Vite frontend runs on `http://localhost:5173` when started separately with `npm run dev`. For frontend-to-backend integration locally, set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=/api/v1`; Vite proxies `/api` to port 8080. The Render static site currently uses demo mode; deploying the API publicly and setting CORS/API URL is a separate release step. Change the default local PostgreSQL password before any shared deployment.

The original Java files at repository root are legacy fragments and are not part of the new Maven build. The supported runnable backend source of truth is `backend/src/main/java/com/hms`.
