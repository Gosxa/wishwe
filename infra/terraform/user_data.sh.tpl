#!/bin/bash
###############################################################
# templates/user_data.sh.tpl
# Bootstrap script executed on first EC2 boot.
# Variable substitution is handled by Terraform templatefile().
###############################################################

set -euo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

echo "==> Starting bootstrap for project: ${project_name}"

# ── System update ─────────────────────────────────────────────
apt-get update -y
apt-get upgrade -y

# ── Essential packages ────────────────────────────────────────
apt-get install -y \
  curl \
  unzip \
  git \
  ufw \
  nginx \
  certbot \
  python3-certbot-nginx \
  fail2ban

# ── Firewall (UFW) ────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# ── Nginx placeholder page ────────────────────────────────────
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head><title>${project_name}</title></head>
<body><h1>${project_name} is up and running 🚀</h1></body>
</html>
EOF

systemctl enable nginx
systemctl start nginx

# ── fail2ban (SSH brute-force protection) ─────────────────────
systemctl enable fail2ban
systemctl start fail2ban

echo "==> Bootstrap complete for ${project_name}"
