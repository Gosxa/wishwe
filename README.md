<div align="center">

# WishWe

**Make plans with friends — from a vague "we should do this sometime" to a real event on the calendar.**

[![Live](https://img.shields.io/badge/Live-wishwe.online-6C5CE7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://wishwe.online)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-FF4438?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonwebservices&logoColor=white)](https://aws.amazon.com)

</div>

---

## Live Preview

### 🌐 **[wishwe.online](https://wishwe.online)**

The app is deployed and open to try. Sign up with an email address or continue with Google.

---

## Technologies Used

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 16.2** | App Router, server components, route handlers that proxy to the API |
| **React 19.2** | UI layer, with the React Compiler enabled |
| **TypeScript 5** | Type safety across the whole app |
| **Zustand 5** | Client state, one store per domain entity |
| **Zod 4** | Runtime validation of every request body |
| **Sass** | Styling via SCSS modules |
| **ESLint · Prettier** | Linting and formatting |

The frontend is organised with **[Feature-Sliced Design](https://feature-sliced.design/)** — `app` → `client_pages` → `widgets` → `entities` → `shared`.

### Backend

| Technology | Purpose |
|---|---|
| **Django 6.0** | Core framework |
| **DRF 3.17** | REST API, viewsets, serializers |
| **SimpleJWT** | Authentication, with tokens stored in HttpOnly cookies |
| **Celery 5.6** | Background jobs and scheduled reminders (`celery beat`) |
| **PostgreSQL** | Primary database |
| **Redis 7** | Celery broker and result backend |
| **OpenAPI** | Auto-generated schema via drf-spectacular, served at `/api/doc/swagger/` |

Business logic lives in a **service layer** (`<app>/services/`), which keeps the views thin.

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker Compose** | Production stack: Django, Next.js, Nginx, Redis, Celery worker + beat |
| **Nginx 1.27** | Reverse proxy and TLS termination (Let's Encrypt) |
| **AWS — S3 · CloudFront · ECR · EC2** | Media storage, CDN, image registry, hosting |
| **Terraform** | Infrastructure as code |
| **GitHub Actions** | Build and deploy pipeline |

---

## Features

### 🎯 Wishes & Plans

Two ways to put an idea in front of your friends:

- **Wishes** are open-ended — "let's go hiking sometime". They carry a loose timeframe instead of a date, and friends mark themselves **interested** rather than committing.
- **Plans** are concrete — a date, a time, and a participant range. Friends **join** them, and the plan fills up until it hits capacity.

A wish that gains momentum can be **converted into a plan**, and any wish can be **copied** to start a fresh one from it. Plans track available spots, expire automatically once the event date passes, and can be archived once they're done.

### 👥 Friends

Friend requests, accept and decline, and user search. You can also generate a **personal invite link** and hand it to someone who isn't on the platform yet — signing up through it connects you both automatically.

### 🔒 Visibility Control

Every event is published to either **friends only** or **friends of friends**, so you decide how far an idea travels. Profiles can be set to private separately.

### 🔔 Notifications

An in-app notification feed with read/unread state, covering friend requests and acceptances, people joining or showing interest in your events, updates, cancellations, and wishes that turned into plans. Scheduled **start reminders** are dispatched by Celery ahead of a plan's start time.

### 🔑 Authentication

Email sign-up with a verification code, password reset, and **Google OAuth**. JWTs are kept in HttpOnly cookies and refreshed transparently by Next.js middleware, so tokens never touch client-side JavaScript.

### 🖼️ Profiles

Username, bio, city, date of birth, and gender, plus an avatar with **in-browser cropping** before upload. New users are walked through a short onboarding flow.

### 🔗 Sharing

Events have shareable deep links, and cover images are uploaded to S3 and served through CloudFront.

---
