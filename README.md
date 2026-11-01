# PlatinumOS

A trophy hunting manager built as a Junior Frontend Developer portfolio project.

## Current stage

Tooling foundation only. The React starter is unchanged; product screens and business logic will be built step by step.

## Requirements

- Node.js 24
- npm 11
- Git

## Local development

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite. Keep the terminal running. Stop the server with Ctrl+C.
On other shells, use `npm` instead of `npm.cmd`.

## Commands

| Command                    | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `npm.cmd run dev`          | Start the development server                     |
| `npm.cmd run typecheck`    | Check TypeScript types                           |
| `npm.cmd run lint`         | Check code quality                               |
| `npm.cmd run format`       | Format the project                               |
| `npm.cmd run format:check` | Check formatting                                 |
| `npm.cmd run build`        | Check types and create the production build      |
| `npm.cmd run preview`      | Preview the production build locally             |
| `npm.cmd run check`        | Run formatting, lint and production build checks |

## Foundation

React, TypeScript (strict), Vite, ESLint, Prettier and CSS.
TypeScript is pinned to 5.9.3 to satisfy the generated typescript-eslint dependency range.
The lockfile records the dependency versions; CI uses `npm ci` for reproducible installation.
VS Code extension recommendations and format-on-save settings are included.
GitHub Actions runs quality checks on pushes and pull requests once this project is uploaded to GitHub.

## Planned features

- Game library with search and filters.
- Trophy checklist and personal completion progress.
- Before-you-start tips and related trophy guidance.
- Trophy rarity percentages, with source and update date once a suitable data source is verified.
- Local demo first; Supabase accounts and persistence later.

React Router, TanStack Query, React Hook Form, Zod, Supabase and testing libraries will be added when their features are implemented. No backend, PSN integration or hosting account has been configured yet.

## Environment variables

Do not commit secrets. Local `.env` files are ignored. Variables prefixed with `VITE_` are visible to the browser and must never contain private service credentials.

## Windows troubleshooting

If PowerShell blocks `npm.ps1`, use `npm.cmd` as shown above.
If npm reports a certificate verification error and your system trusts the required certificate, enable system CA certificates for the current terminal before retrying:

```powershell
$env:NODE_USE_SYSTEM_CA='1'
```

Keep TLS verification enabled.

## Local API server (PSN setup: steps 4.1–4.2)

Run the frontend and backend in separate terminals:

```powershell
npm.cmd run dev
npm.cmd run dev:server
```

For a server without automatic restarts, use `npm.cmd run start:server`.
The backend listens only on `127.0.0.1:3001`. Vite proxies `/api` requests to it during development.
Check `http://127.0.0.1:3001/api/health` for the health response.

A fresh checkout needs a local `.env`: copy `.env.example` to `.env` without overwriting an existing file.
Leave `PSN_NPSSO` blank until the authentication step. Never share its value, prefix it with `VITE_`, or put it in frontend code.
`server/config.mjs` loads the project-root `.env` with Node's built-in loader. Restart the backend after changing `.env`.
The `.env` file is ignored by Git; only the empty example belongs in the repository.

Missing or blank configuration keeps the health endpoint working and prints a clear message.
A configured value means only that a value exists, not that it is valid or that PSN is connected.
Authentication, token refresh and game-library fetching are implemented below. Individual trophy fetching is a later step.

## PSN authentication and library (steps 4.3–4.4)

This is a local, single-account integration using an unofficial PSN client. Do not publish these personal-data endpoints without application authentication and a review of provider terms.

1. Sign in to your account on the official PlayStation website in your browser.
2. In that same browser open `https://ca.account.sony.com/api/v1/ssocookie` as described in the psn-api manual authentication documentation.
3. Copy the NPSSO value directly into local `.env` as `PSN_NPSSO=your_value`. Do not send it through chat, commit it, or include it in screenshots.
4. Restart the backend using `npm.cmd run dev:server`.
5. Open `/api/psn/games` through Vite to trigger authentication and fetch your trophy-linked titles.

Endpoints:

- `/api/psn/status`: configuration and authentication state only. Reading this endpoint does not log in.
- `/api/psn/games`: performs lazy authentication and retrieves all library pages, with a safety limit of 100 pages. This is a trophy-linked library, not a list of all purchased games.
- `/api/health`: backend health only; success does not mean PSN is connected.

Tokens stay in backend memory. Access tokens are refreshed ahead of expiry; expired refresh tokens trigger a new NPSSO exchange. Failed authentication is sanitized and has a 30-second retry cooldown. Restarting clears tokens and the 60-second games cache. NPSSO may eventually need manual replacement.
Provider requests have bounded waits, but the wrapper cannot cancel the underlying psn-api request. No credentials or raw provider errors are returned by our routes.

Games include the trophy set ID, service name, title, platform, optional icon, PSN-reported progress, trophy counts and last update. Missing counts remain null. The response includes source and fetch time.

Run `npm.cmd run test:server` for offline tests with synthetic data. These verify auth lifecycle, concurrent requests, pagination, cache and error handling; a successful real PSN request must still be verified locally after credentials are configured. Trophy details and UI rendering of the library are later steps.

## Frontend tests

Run `npm.cmd run test:frontend` for one run, or `npm.cmd run test:watch` while editing.
`npm.cmd run check` includes both frontend and backend tests.

Vitest runs React components in jsdom. Testing Library and user-event find controls by their accessible labels and simulate typing, clicks and keyboard input. These tests cover trophy search and filters, spoiler protection, request retries, Planner editing and persistence, and Pro tips integration.

Tests use fictional fixtures, replace fetch, and reset isolated jsdom storage between cases. They do not need a running server, PSN credentials or your browser data. Remounting components checks that persisted data can be restored. Storage failures are simulated to verify retry behavior.

A test follows Arrange–Act–Assert: render the component with known data, perform an action, then check the result with `expect`. jsdom does not check visual layout or replace testing in a real browser.
