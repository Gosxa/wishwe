# Local full-stack test environment

This Compose file is isolated from the production Compose stack. It runs local
PostgreSQL, Redis, Django, the Celery worker and beat, plus the Next.js dev
server. The backend image installs Tesseract and its English language data, so
no OCR executable is needed on the host computer.

## Start

From the repository root, copy the optional API-key template and add a key if
you want to exercise real image checks:

```powershell
Copy-Item infra/docker/.env.test.example infra/docker/.env.test
notepad infra/docker/.env.test
docker compose -f infra/docker/docker-compose-test.yml up --build
```

Set `OPENAI_API_KEY` in `infra/docker/.env.test`. Keep it private; that file is
ignored by Git. Without a key, the backend still starts, but image moderation
fails closed and retries without issuing a strike.

The app is at `http://localhost:3000`, the API and Django admin are at
`http://localhost:8000` and `http://localhost:8000/admin/`. Create a local
admin account with:

```powershell
docker compose -f infra/docker/docker-compose-test.yml exec django python manage.py createsuperuser
```

Registration email codes are printed in the Django container logs because this
environment uses the console email backend.

The test settings use a separate PostgreSQL database and filesystem media
storage. Django and Celery share a Docker volume at `/app/media`; staged images
are not exposed through a public CDN. Images held for review or rejected by
moderation remain visible in Django admin under **User → Image moderations**
for seven days after resolution. While an event cover is under review, its
creator can preview it on their feed and profile; other users cannot see it.
The files live in the `test_media` Docker volume and are served from
`http://localhost:8000/media/`. Celery Beat cleans expired copies hourly. The
named volumes persist between starts.
To reset the local database, media, and frontend cache, stop the stack and run:

```powershell
docker compose -f infra/docker/docker-compose-test.yml down -v
```

This removes only the test stack's named volumes. Do not run that command with
the production Compose file.

The browser uses `localhost:8000` for media URLs, while Next.js server handlers
use the internal Compose address `django:8000`. `BACKEND_INTERNAL_URL` is only
used by server-side frontend code; normal deployments can leave it unset.
