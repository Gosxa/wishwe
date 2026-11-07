FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

ENV HOME=/home/django

RUN addgroup --system django && adduser --system --ingroup django --home /home/django django \
    && mkdir -p /home/django/.gunicorn \
    && chown -R django:django /home/django /app

USER django

CMD ["sh", "-c", "daphne -b 0.0.0.0 -p ${PORT:-8000} wishwe_api.asgi:application"]
