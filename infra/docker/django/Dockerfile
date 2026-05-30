FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

<<<<<<< HEAD
# Collect static files
RUN python manage.py collectstatic --noinput

# Create a non-root user
=======
>>>>>>> recovered-rebase
RUN addgroup --system django && adduser --system --ingroup django django \
    && mkdir -p /app/staticfiles \
    && chown -R django:django /app

USER django

CMD ["gunicorn", "wishwe_api.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
