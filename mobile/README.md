# WishWe mobile

Expo / React Native app for WishWe. It currently includes email login, registration, password reset, and profile onboarding. The signed-in feed and other main product screens still need to be built.

## Quick start

```bash
npm install
cp .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `.env`:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Production: `https://wishwe.online`

## Important points

- Routes are in `src/app`; auth, onboarding, and signed-in screens are protected automatically. Do not navigate manually after login, logout, or onboarding.
- The native app stores JWTs in SecureStore and sends them as Bearer tokens. Reuse `src/lib/api/client.ts`; do not switch to normal cookie auth.
- For image uploads, reuse the byte-based FormData pattern in `src/lib/api/profile.ts`. The old React Native `{ uri, name, type }` pattern does not work with Expo 57.
Useful commands:

```bash
npm run lint
npx tsc --noEmit
```
