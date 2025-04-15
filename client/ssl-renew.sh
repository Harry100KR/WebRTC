#!/bin/sh

# Renew the certificate
certbot renew --quiet

# Reload nginx to pick up the new certificate
nginx -s reload 