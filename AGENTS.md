# AGENTS.md

## Cursor Cloud specific instructions

This is a **Vue 3 + Vite** single-page app (`epi-sistem` / "OmniSeg") for managing PPE/EPI. It uses npm (`package-lock.json`). The only backend is **Supabase** (Auth + PostgreSQL + Storage); there is no server in this repo. The DB schema lives in the external Supabase project and is documented in `docs/projeto.json`.

### Commands (see `package.json` scripts)
- `npm run dev` — Vite dev server on `http://localhost:5173/` (main way to run the product).
- `npm run build` / `npm run preview` — production build / preview.
- `npm test` — Vitest unit tests (`vitest run`).
- `npm run check` — custom node assertion scripts (contrast tokens, dates, stock logic).
- There is **no lint script** configured in this repo.

### Supabase configuration (non-obvious)
- The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Vite exposes any `VITE_`-prefixed **environment variable** (e.g. Cloud Agent secrets) in addition to a local `.env` file — no `.env` is required if those are set in the environment.
- `.env` is gitignored and is **not** committed. Without real Supabase credentials, a local `.env` with placeholder values is enough to boot the dev server and render the public landing page plus the auth/registration pages (client-side validation works offline). Any actual data/auth action (login, registration submit, stock, approvals) requires reachable Supabase credentials.
- If `createClient` receives an empty URL it throws, which breaks the `/login` and `/cadastro_user` routes on load — so keep at least placeholder `VITE_SUPABASE_*` values present when running without real credentials.

### Routing notes
- Only `/`, `/login`, and `/cadastro_user` are public. All other routes are behind an auth guard (`src/router/index.js`) that redirects to `/login` without a session, and to `/estoque` when the role is not permitted. The Supabase client (~185 kB) is lazy-loaded only on `/login` and protected routes, so the public landing page renders without it.
