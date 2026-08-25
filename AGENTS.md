# Repository Guidelines

## Project Structure & Module Organization

WishWe is a monorepo. `frontend/` contains the Next.js 16 web app; its `src/`
follows Feature-Sliced Design (`app` → `client_pages` → `widgets`/`features` →
`entities` → `shared`). Assets live in `public/`, unit tests beside source, and
Playwright tests in `e2e/`. `backend/` is a Django REST API with `user`, `event`,
and `notifications` apps, shared code in `common/`, and domain logic in
`services/`. `mobile/` is an Expo Router app with routes in `src/app`, reusable
code elsewhere in `src/`, and media in `assets/`. Deployment definitions are in
`infra/docker` and `infra/terraform`; helpers are in `scripts/`.

## Build, Test, and Development Commands

Run commands from the relevant package:

- `cd frontend && npm ci && npm run dev` installs dependencies and starts the web
  app. Use `npm run build`, `npm run lint`, and `npm test` before review.
- `cd backend && python -m pip install -r requirements.txt` installs API
  dependencies. Run `python manage.py migrate`, then `python manage.py runserver`.
- `cd backend && python manage.py test` runs the Django test suite.
- `cd mobile && npm ci && npm start` launches Expo; `npm run lint` checks it.
- `cd frontend && npm run test:e2e:install && npm run test:e2e` runs Playwright
  after installing its browser binaries.

## Coding Style & Naming Conventions

Frontend code uses TypeScript, two-space indentation, single quotes, semicolons,
and an 80-column Prettier target; `npm run lint` enforces ESLint and Prettier.
Name React components `PascalCase`, hooks `useSomething`, and SCSS files
`*.module.scss`. Python uses four spaces, `snake_case` for modules/functions,
and `PascalCase` for classes. Keep Django views thin and place domain behavior in
services.

## Testing Guidelines

Use Vitest and Testing Library for web units (`*.test.ts` or `*.test.tsx`) and
Playwright for journeys (`e2e/*.spec.ts`). Django tests belong in each app's
`tests/test_*.py`. Add regression coverage with behavior changes; run the
smallest relevant suite locally, then the package's full lint and test commands.

## Commit & Pull Request Guidelines

Recent history favors concise Conventional Commit subjects such as
`feat(frontend): add share dialog`, `fix(frontend): stabilize transitions`, and
`test(frontend): cover invite flow`. Use an imperative summary and an accurate
scope. Keep PRs focused; include a clear description, linked issue when present,
commands run, screenshots for visual changes, and notes about migrations or new
configuration.

## Security & Agent Notes

Never commit `.env`, credentials, Terraform state, or `*.tfvars`; these are
ignored intentionally. Read `mobile/AGENTS.md` before mobile work for Expo,
authentication, upload, and routing constraints.
