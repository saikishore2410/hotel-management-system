# QA and release readiness — Hotel Management System

## Scope
Frontend source review, JavaScript utility unit tests, React UI tests, dependency/build setup, CI and static frontend deployment workflow.

## Findings from repository inspection
1. **Build was not reproducible:** React/Vite source existed without `package.json` or `index.html`; `package-lock.json` had no dependency packages. This branch adds the missing project metadata and HTML entry point.
2. **No automated CI evidence:** no prior GitHub Actions workflow runs were found. CI has been added for push and pull-request validation.
3. **Deployment path missing:** a GitHub Pages workflow has been added for the frontend. Repository Pages settings may need to be set to **GitHub Actions**.
4. **Backend build missing:** Java source files exist but no Maven or Gradle build descriptor was found in the repository root. Backend compilation, database integration, API security, and load tests cannot be marked as executed without a runnable backend and test environment.
5. **Live API gap documented:** README describes `GET /api/v1/rooms` and guest endpoints as still to be built. Demo mode remains the intended default.

## Automated frontend coverage added
- Date arithmetic including month/year boundaries and leap day.
- Currency formatting, numeric room sorting, floor mapping, room type labels.
- Dashboard smoke test, room status filtering, booking form validation, room detail dialog.
- CI runs `npm ci`, `npm test`, and `npm run build`.
- Pages deployment runs only after tests and build pass.

## Local commands
```bash
npm ci
npm test
npm run build
npm run dev
```

Use `VITE_USE_MOCK=true` for demo mode. Use `VITE_USE_MOCK=false` only when the Spring Boot API includes the room and guest endpoints. For static deployments, configure `VITE_API_BASE_URL` to the deployed API URL and enable suitable backend CORS rules.

## Release status
Frontend build/test readiness is now automated but must be confirmed from the GitHub Actions run. Full production integration remains blocked on a runnable backend build, configured database, implemented endpoints, and deployed API.

## Further tests before production
- Backend unit, repository, and API integration tests with an ephemeral database.
- Dependency audit, authentication/authorization tests, input validation and secret scanning.
- Browser-based end-to-end tests against staging.
- Load/performance tests with explicit latency and throughput objectives.
