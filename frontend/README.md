This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tests

Install the frontend packages before running tests:

```bash
npm ci
```

### Unit and component tests

Vitest and Testing Library test helpers, hooks, forms, pages, and UI components.
The test files are next to the code and end in `.test.ts` or `.test.tsx`.

```bash
# Run all unit and component tests
npm test

# Run one test file
npm test -- src/shared/lib/nextPath.test.ts
```

### End-to-end tests

Playwright tests full user flows such as sign-in, events, friends, invites,
profiles, sharing, notifications, and the product tour. The tests are in
`e2e/`.

First, install the backend packages and Playwright browsers:

```bash
python -m pip install -r ../backend/requirements.txt
npm run test:e2e:install
```

Run the end-to-end tests:

```bash
# Run all configured projects (desktop browsers and mobile tests)
npm run test:e2e

# Run in one browser only
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Run tests marked @mobile on a Pixel 7-sized Chrome browser
npm run test:e2e -- --project=mobile-chrome

# Run one test file in one browser
npm run test:e2e -- e2e/auth.spec.ts --project=chromium
```

Playwright starts its own frontend and backend and uses a separate SQLite test
database, so it does not change the development database. Failed runs save
screenshots, videos, and traces in `test-results/`. Open the HTML report with:

```bash
npm run test:e2e:report
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
