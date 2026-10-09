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

## Backend status
Java source files are present, but this repository root currently has no Maven or Gradle build descriptor. Full backend compilation, database integration, security testing and live end-to-end validation require a runnable backend project and configured database. Demo mode is not evidence that the production API works.
