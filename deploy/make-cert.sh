#!/usr/bin/env bash
# Create a private certificate authority and a server certificate for the unit network.
#   bash deploy/make-cert.sh parashurama.local 192.168.1.10
# Then install deploy/certs/unit-ca.crt as a trusted root on each trainee laptop (once).
set -euo pipefail
NAME="${1:-parashurama.local}"; IP="${2:-127.0.0.1}"
DIR="$(cd "$(dirname "$0")" && pwd)/certs"; mkdir -p "$DIR"; cd "$DIR"
if [ ! -f unit-ca.key ]; then
  openssl req -x509 -newkey rsa:3072 -sha256 -days 3650 -nodes -keyout unit-ca.key -out unit-ca.crt -subj "/CN=PARASHURAMA Unit CA" >/dev/null 2>&1
fi
openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -subj "/CN=$NAME" >/dev/null 2>&1
printf "subjectAltName=DNS:%s,DNS:localhost,IP:%s,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n" "$NAME" "$IP" > server.ext
openssl x509 -req -in server.csr -CA unit-ca.crt -CAkey unit-ca.key -CAcreateserial -out server.crt -days 825 -sha256 -extfile server.ext >/dev/null 2>&1
rm -f server.csr server.ext; chmod 600 unit-ca.key server.key
echo "✓ Certificates in $DIR  (server.crt / server.key for the server, unit-ca.crt to trust on laptops)"
