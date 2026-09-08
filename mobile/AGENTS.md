# WishWe Mobile Agent Guide

This file applies to everything under `mobile/`. Also follow the repository-root
`AGENTS.md`; this file adds mobile-specific constraints.

## Stack and source of truth

- Expo SDK 57, React Native 0.86, React 19, TypeScript 6, and Expo Router.
- `app.json` contains the base Expo configuration. `app.config.ts` extends it
  with environment-dependent native configuration. Keep both in sync.
- Expo changes between SDK releases. Use APIs compatible with SDK 57 and, when
  behavior is uncertain, consult the exact versioned documentation at
  <https://docs.expo.dev/versions/v57.0.0/>.
- Install Expo or React Native packages with `npx expo install <package>` so the
  installed version matches the SDK. Use `npm install` only for ordinary
  JavaScript packages.
- Commit `package-lock.json` whenever dependencies change. Do not hand-edit the
  lockfile.

## Project map

- `src/app/`: Expo Router routes and layouts. Route groups are `(auth)`,
  `(onboarding)`, and `(app)`; authenticated tabs live in `(app)/(tabs)`.
- `src/components/`: reusable UI grouped by feature. Small shared primitives are
  in `components/ui`, while app-wide icons live in `components/icons`.
- `src/hooks/`: reusable stateful behavior that is not domain-specific.
- `src/lib/api/`: Django API transport, endpoint functions, backend response
  types, media URL handling, and cookie parsing.
- `src/lib/auth/`: session persistence, the authentication provider, validation,
  and platform-specific Google sign-in.
- `src/lib/events/`: mobile-facing event types, backend-to-UI mapping, query
  translation, and event hooks.
- `src/constants/theme.ts`: shared colors, fonts, spacing, and radii.
- `assets/`: bundled images, fonts, and icon sources.
- `app.json`, `app.config.ts`, `eas.json`, and `metro.config.js`: runtime, native,
  build, and bundler configuration.

Prefer the `@/` alias for files under `src/` and `@/assets/` for assets. Keep
route files focused on screen composition; move reusable views, data access, and
domain behavior into the directories above.

## Local commands

Run commands from `mobile/`:

```bash
npm ci
npm start
npm run android
npm run ios
npm run web
npm run lint
npm test
npx tsc --noEmit
```

Use `npm run android` or `npm run ios` after adding a native dependency or
changing native configuration. For later runs of an already-installed
development build, use `npm run start:dev-client`. Expo Go cannot exercise
native Google sign-in.

The app needs the Django API. Follow `mobile/README.md` for end-to-end local
setup. Common API base URLs are:

- iOS Simulator and web: `http://localhost:8000`
- Android Emulator: `http://10.0.2.2:8000`
- Physical device: `http://<development-machine-lan-ip>:8000`

Restart Metro after changing `.env`.

## Routing and application state

- Let the filesystem define routes. Add screens under the appropriate route
  group and register explicit stack/tab options in that group's `_layout.tsx`.
- The root layout owns fonts, the splash screen, `AuthProvider`, and protected
  route groups. Do not duplicate authentication redirects inside individual
  screens unless the route cannot be expressed with `Stack.Protected`.
- Authentication has three meaningful states: loading, signed out, and signed
  in. Do not hide the splash screen before session restoration finishes.
- A signed-in profile without a username is considered incomplete and is routed
  to onboarding. After changing profile data, call `refreshProfile()` so route
  guards and UI use the server's current state.
- Transient email verification state belongs to `AuthFlowProvider` in the
  `(auth)` group. Do not put secrets, passwords, or verification tokens in route
  parameters or persistent storage.
- Use typed Expo Router navigation and preserve dynamic route parameter types.
  Prefer route groups over imperative navigation workarounds.

## API, authentication, and backend contracts

- Add endpoint wrappers in `src/lib/api/`; screens and components should not call
  `fetch` directly.
- Use `apiRequest` or `apiRequestWithResponse`. Set `auth: true` for protected
  endpoints so bearer injection, a single refresh retry, and invalid-session
  cleanup continue to work.
- Authentication responses store JWTs delivered through `Set-Cookie` headers.
  Preserve `readSetCookieHeader`, `readCookie`, and `session-store` behavior when
  modifying login or refresh flows. Native tokens belong in Expo SecureStore;
  web uses local storage as the existing fallback.
- Throw or surface `ApiError` for transport and HTTP failures. A status of `0`
  means the request did not complete as an HTTP response. Keep user-facing error
  messages useful while avoiding raw server or exception details in production.
- Model Django response fields exactly in API-layer types, including snake_case.
  Translate them into UI-friendly types in a mapper such as
  `src/lib/events/mapper.ts`; do not spread backend naming throughout components.
- Build endpoint URLs from `API_URL`. Use `toAbsoluteMediaUrl` for backend media
  paths rather than assuming that returned paths are already absolute.
- For `FormData`, never set `Content-Type` manually; `fetch` must add the multipart
  boundary. Keep upload MIME types within the backend allow-list and use a longer
  timeout for media operations. The current avatar upload intentionally converts
  an Expo `File` to bytes for React Native's multipart implementation.
- When an API contract changes, inspect the corresponding Django serializer,
  view, and service in `backend/`, update both sides if the task requires it, and
  add mapper or request-shape regression coverage.

## Platform and native-code rules

- `EXPO_PUBLIC_API_URL` and OAuth client IDs are public build-time identifiers,
  not secrets. Never add private keys, OAuth client secrets, signing files, or
  production credentials to Expo config, EAS config, source code, or git.
- Keep platform differences in `.native.ts`, `.ios.ts`, `.android.ts`, or `.web.ts`
  modules when possible instead of scattering `Platform.OS` checks across UI.
- Google sign-in uses a Web OAuth client ID as the backend token audience.
  Android additionally requires the correct package/SHA-1 OAuth registration;
  iOS requires its iOS client ID and derived reversed URL scheme. Changes to
  these values or the plugin require rebuilding and reinstalling the native app.
- `android/` and `ios/` are generated native projects and are ignored here. Treat
  Expo config/plugins as the source of truth. Do not manually patch generated
  native files unless the task explicitly requires a maintained native change.
- Preserve `metro.config.js` SVG transformer behavior and the `svg.d.ts` module
  declaration when working with SVG imports.
- EAS archives from the repository root and is constrained by the root
  `.easignore`. If mobile starts importing a shared workspace path, update that
  archive allow-list as part of the same change.

## UI and accessibility conventions

- Use React Native components and `StyleSheet.create`; do not introduce DOM-only
  elements into shared native screens.
- Reuse `Colors`, `Fonts`, `Spacing`, and `Radii` from `src/constants/theme.ts`.
  The custom fonts are loaded by the root layout, so refer to the exported font
  names rather than inventing local family strings.
- Respect safe-area insets for content near device edges and make scrollable
  screens usable with the keyboard open.
- Give interactive controls an accessibility role and label. Communicate
  validation and request failures accessibly, preserve usable touch targets, and
  include pressed, disabled, loading, empty, and error states where applicable.
- Guard mutations against duplicate taps. In async effects and paginated data,
  ignore stale results after unmount or request-key changes; follow the existing
  cancellation/snapshot patterns in `src/hooks` and `src/lib/events`.
- Prefer small, reusable components to large route files, but keep one-off layout
  code local when extracting it would obscure rather than clarify the screen.

## Tests and verification

- Put Vitest files beside the source as `*.test.ts` or `*.test.tsx`.
- Prioritize pure contract logic: request/query translation, validation,
  backend-to-view mapping, platform selection, session behavior, and regressions
  for edge cases. Mock native modules and environment variables explicitly.
- Keep tests deterministic. Do not call live APIs, depend on local credentials,
  or use the developer's persisted device session.
- For every change, run the narrowest relevant test first. Before handing off a
  normal code change, run:

```bash
npm run lint
npm test
npx tsc --noEmit
```

- Also exercise the affected platform when behavior depends on navigation,
  permissions, native modules, keyboard/safe-area layout, deep links, or build
  configuration. State which platforms were and were not manually checked.

## Change discipline

- Preserve unrelated work and generated artifacts. Do not edit `.expo/`,
  `node_modules/`, `dist/`, or generated native directories as source changes.
- Do not commit `.env`; update `.env.example` when a new public configuration key
  is required and document its target-specific value or purpose.
- Keep changes focused. A mobile-only UI change should not alter backend or
  frontend code unless a shared contract genuinely requires it.
- Update `mobile/README.md` when setup, emulator networking, OAuth registration,
  native build steps, or EAS behavior changes.
- Before completion, verify that routes are reachable in the correct auth state,
  failure/loading states remain usable, API fields are mapped deliberately, and
  the relevant automated checks pass.

