# HMS front desk dashboard

React + Vite + Tailwind CSS v4 + Lucide icons.

## Set up

```bash
npm create vite@latest hms-frontend -- --template react
cd hms-frontend
npm install
npm install lucide-react tailwindcss @tailwindcss/vite
```

Copy `vite.config.js` and the `src/` folder from this project over the generated ones, and delete
`src/App.css` and `src/assets`. Then create a `.env` file:

```
VITE_USE_MOCK=true
```

```bash
npm run dev
```

## Demo data vs the backend

`VITE_USE_MOCK=true` (the default if unset) runs against an in-memory backend that follows the same
rules as `BookingService`. Set `VITE_USE_MOCK=false` to call Spring Boot on port 8080 through the Vite proxy.

Endpoints the dashboard calls:

| Call | Status |
|---|---|
| `GET /api/v1/bookings?size=200&sort=checkInDate,asc` | exists |
| `POST /api/v1/bookings` | exists |
| `PATCH /api/v1/bookings/{id}/status` | exists |
| `GET /api/v1/rooms` returning `[{ id, roomNumber, type, pricePerNight, status }]` | still to build |
| `GET /api/v1/guests?q=<email>` returning a `PageResponse` | still to build |
| `POST /api/v1/guests` with `{ name, email, phone, idNumber }` returning `{ id, ... }` | still to build |
