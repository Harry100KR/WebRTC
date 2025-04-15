#!/bin/sh

# Create directory for certbot challenges
mkdir -p /var/www/certbot

# Check if we need to generate a new certificate
if [ ! -f "/etc/nginx/ssl/live/${DOMAIN}/fullchain.pem" ]; then
    # Generate SSL certificate
    certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email ${SSL_EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN} \
        -d www.${DOMAIN}
fi

# Start crond for certificate renewal
crond

# Start nginx
exec "$@" 