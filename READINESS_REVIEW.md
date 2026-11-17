# Eventora launch review

Reviewed 17 November 2026. Verdict: not ready for a public launch.

## Launch blockers

1. `client/src/utils/axios.js:4` hardcodes `http://localhost:5000/api`. Visitors would call their own computer. Configure an environment-based HTTPS API URL or a same-origin API proxy.
2. Only `server/.env.example` is present. Supply a working MongoDB URI, a unique strong JWT secret, and working email credentials through the hosting environment. Do not use the example JWT secret.
3. `server/utils/email.js:57` catches OTP delivery failures without propagating them. Registration and booking can report success when no code was delivered.
4. `server/controllers/bookingController.js:58` confirms bookings and decrements seats through separate reads/writes. Concurrent confirmations can overbook or lose seat updates. Confirmation and cancellation need atomic state transitions and consistent seat updates, preferably in a database transaction.
5. Auth and booking routes have no request throttling or OTP attempt limit. OTP generation uses `Math.random`; use a cryptographic generator. OTP verification queries do not explicitly check age and rely on eventual database TTL cleanup. Enforce expiration and consume codes atomically.
6. `server/controllers/eventController.js:49` accepts the complete update body without an allowlist or update validators. Event schemas lack positive integer seat constraints and nonnegative price constraints. Validate input and preserve seat counts when changing capacity.

## Other defects and gaps

- Booking creation has no database constraint preventing concurrent duplicate active bookings. The existing-booking query can also select a cancelled record even when another active record exists.
- The confirmation endpoint rejects only confirmed bookings; a cancelled booking can be confirmed through the API. A booking whose event has been deleted triggers a null dereference.
- Database connection errors are logged, but the HTTP listener still starts. Validate required configuration and connect successfully before reporting readiness.
- `server/seed.js` deletes all users, events, and bookings and creates a known admin password. Never run this against production data. Provide a separate controlled admin setup process.
- Root `start` runs Vite preview, which should be replaced with a production static hosting arrangement. BrowserRouter routes need an index.html fallback on the chosen host.
- The lint command references ESLint, but ESLint and its configuration are absent from the project. No automated test scripts are provided.
- Payment is manual admin bookkeeping; no payment gateway is implemented. The separate payment result screens and homepage ticket download claim should match the actual workflow.
- CORS currently allows every origin. Configure the deployed frontend origin.

## Validation limits

Backend JavaScript files passed `node --check`. Frontend dependency installation succeeded on retry with elevated access. The frontend production build passed (`vite v5.4.21`, 100 modules transformed) after rerunning outside a filesystem restriction. Initial frontend/backend installs encountered access errors; backend installation was not completed. Lint could not run because ESLint is absent. A successful frontend build does not verify database, email, or booking behavior.

Source review covers frontend pages/context/API client and backend routes, controllers, models, middleware, email utility, seed script, package scripts, and setup documentation. No configured database or email service was available for end-to-end tests. Build and dependency installation results are reported separately in the conversation; this document does not assert that they passed. The database seed was not executed and the application was not published.

## Before going live

Fix the blockers above, complete dependency installation and security auditing, pass the production build, restore a working lint setup, then test registration/email verification, login, free and paid manual bookings, rejection/cancellation, simultaneous last-seat confirmations, event deletion, and admin authorization against a disposable database. Deploy with HTTPS and configured secrets, verify direct navigation to frontend routes, and repeat the main flows on the deployed instance.
