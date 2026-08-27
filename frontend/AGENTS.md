# Repository Guidelines

## Project Structure & Module Organization

This directory contains the WishWe Next.js 16 frontend. Application code lives
in `src/` and follows Feature-Sliced Design: `app` composes routes, followed by
`client_pages`, `widgets`, `features`, `entities`, and `shared`. Keep imports
pointing toward lower layers and expose public APIs through each slice's
`index.ts`. Static images and fonts belong in `public/`. Unit tests sit beside
the code they cover; browser journeys live in `e2e/`. The adjacent `backend/`
and `mobile/` packages are maintained and tested independently.

## Build, Test, and Development Commands

Run commands from `frontend/`:

- `npm ci` installs the exact dependency versions in `package-lock.json`.
- `npm run dev` starts the local Next.js development server.
- `npm run build` creates a production build; `npm start` serves it.
- `npm run lint` runs ESLint with Next.js and Prettier rules.
- `npm test` runs the Vitest unit suite once.
- `npm run test:e2e:install` installs Playwright browsers.
- `npm run test:e2e` runs all end-to-end journeys; use
  `npm run test:e2e:report` to inspect the latest report.

## Coding Style & Naming Conventions

Write TypeScript with two-space indentation, single quotes, semicolons, and an
80-column Prettier target. Name React components in `PascalCase`, hooks with a
`use` prefix, and styles `*.module.scss`. Keep route files aligned with Next.js
conventions (`page.tsx`, `layout.tsx`, and `route.ts`). Prefer small components,
typed boundaries, and slice-level exports over deep cross-feature imports.

## Testing Guidelines

Use Vitest and Testing Library for component and module tests named
`*.test.ts` or `*.test.tsx`. Use Playwright specs named `e2e/*.spec.ts` for
critical user flows and accessibility checks. Add regression coverage with
behavior changes. Run the smallest relevant test first, then `npm run lint`,
`npm test`, and `npm run build`; run Playwright when a user journey changes.

## Commit & Pull Request Guidelines

Follow concise Conventional Commit subjects used in recent history, such as
`feat(frontend): add share dialog` or `fix(frontend): stabilize transitions`.
Use an imperative summary and an accurate scope. Keep pull requests focused and
include a clear description, linked issue when applicable, verification commands,
screenshots for visual changes, and notes about configuration or API assumptions.

## Security & Configuration

Never commit `.env*`, credentials, generated reports, or build artifacts. Add
new environment variables to project documentation with safe example values,
and keep secrets in local or deployment-managed configuration.
