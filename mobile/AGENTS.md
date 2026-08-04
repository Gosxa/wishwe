# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Auth (not obvious)

The API hands out its JWTs **only as `Set-Cookie` headers**, and marks them `Secure` (`DEBUG` is
hardcoded `False` in the backend settings). A native cookie jar therefore drops them on a
plain-HTTP dev server, so mobile cannot rely on cookies the way the web app does.

Instead `src/lib/api/cookies.ts` reads the tokens straight off the response header, and
`src/lib/auth/session-store.ts` keeps them in expo-secure-store. Authed requests send
`Authorization: Bearer <access>`, which the backend's `CookieJWTAuthentication` accepts as well
(the header wins over the cookie).

One exception: `/api/user/auth/token/refresh/` reads the refresh token from `request.COOKIES` only,
so `src/lib/api/client.ts` hand-builds a `Cookie: refresh_token=...` header for that one call.

Routing is guarded by `Stack.Protected` in `src/app/_layout.tsx`, across three groups: `(auth)`
when signed out, `(onboarding)` when signed in without a username, `(app)` once onboarded. Signing
in, onboarding, or signing out flips a guard and the router moves the user by itself — screens
should not navigate manually after those.

## File uploads (not obvious)

Expo replaces the global `fetch` with its own WinterCG version, which **rejects React Native's
classic `{ uri, name, type }` FormData part** — it throws `Unsupported FormDataPart
implementation`. It accepts only a string, a `Blob`, or an object exposing `bytes()`
(see `node_modules/expo/src/winter/fetch/convertFormData.ts`). `uploadAvatar` in
`src/lib/api/profile.ts` therefore reads the file with `expo-file-system`'s `File` and appends
`{ name, type, bytes() }`, which also pins a content type the backend's allow-list accepts.

## Onboarding

`/api/user/profile/me/` does not expose `is_onboarded`, so `needsOnboarding()` in
`src/lib/api/profile.ts` infers it from an empty `username` (onboarding is the only flow that sets
one). Both the onboarding and avatar endpoints answer with **partial** data — just the fields they
were given — so reload the profile afterwards rather than trusting their responses.
