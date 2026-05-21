#!/bin/bash

# ============================================================
# Run this ONCE on first deploy to get your SSL certificate.
# After this, certbot will auto-renew every 12 hours.
# Usage: ./init-ssl.sh yourdomain.com admin@yourdomain.com
# ============================================================

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: ./init-ssl.sh yourdomain.com admin@yourdomain.com"
  exit 1
fi

echo ">>> Downloading recommended TLS parameters..."
mkdir -p ./certbot/conf
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
  > ./certbot/conf/options-ssl-nginx.conf
openssl dhparam -out ./certbot/conf/ssl-dhparams.pem 2048

echo ">>> Starting nginx in HTTP-only mode for ACME challenge..."
# Temporarily use plain HTTP config so nginx can start before certs exist
docker compose up -d nginx

echo ">>> Requesting certificate from Let's Encrypt..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo ">>> Reloading nginx with SSL config..."
docker compose exec nginx nginx -s reload

echo ""
echo "Done! SSL certificate issued for $DOMAIN"
echo "Certbot will auto-renew every 12h via the certbot container."