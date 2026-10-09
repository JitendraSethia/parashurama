# Admin guide: install, deploy, operate

Three ways to run PARASHURAMA, from simplest to fullest.

## 1. Single laptop, fully offline (no server)

```bash
npm ci && npm run build:single
```
Copy `apps/web/dist-single/index.html` to the laptop and open it in Chrome or Edge. Fonts are embedded and nothing uses the network. Drill history stays in that browser.

## 2. Unit server with Docker (recommended)

Requires Docker with Compose on a small PC on the unit network.

```bash
bash deploy/make-cert.sh parashurama.local 192.168.1.10   # name and IP of the server
docker compose up -d --build
docker compose logs server                                # shows the first admin password once
```
Trainees open `https://parashurama.local` (or `https://192.168.1.10`). Install `deploy/certs/unit-ca.crt` as a trusted root certificate on each laptop once, so browsers trust the server. The app can also be installed from the browser (*Install app*) and keeps working if the network drops; drills made offline sync when the server is reachable again.

The `backup` service writes a consistent copy of the database every day to the data volume (`/data/backups`, newest 14 kept).

> The Dockerfile and Compose file are provided but were not executed in the build environment (no Docker available there). The server itself, HTTPS, backups and the CLI were tested directly with Node.

## 3. Unit server without Docker (systemd)

Requires Node.js 22.5 or newer.

```bash
sudo useradd -r parashurama && sudo mkdir -p /var/lib/parashurama && sudo chown parashurama /var/lib/parashurama
sudo git clone <repo> /opt/parashurama && cd /opt/parashurama && sudo npm ci && sudo npm run build
sudo bash deploy/make-cert.sh parashurama.local 192.168.1.10
sudo cp deploy/parashurama.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now parashurama
journalctl -u parashurama | grep -A1 "First start"          # first admin password
```

## Server settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | 8080 (8443 with TLS) | Listening port |
| `DATA_DIR` | `./data` | Database and backups |
| `WEB_DIR` | `../web/dist` | Built web app to serve |
| `TLS_CERT`, `TLS_KEY` | – | Enable HTTPS (cookies become Secure, HSTS on) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | `admin`, random | First admin account (created only if no users exist) |
| `UNIT_NAME` | `Unit` | Unit name for the first admin |
| `LOG` | on | `0` to silence request logs |

## Accounts and roles

| Role | Can |
|---|---|
| Trainee | Train, see own results |
| Instructor | Edit doctrine and settings, publish scripted drills, see the unit board |
| Commander | See the unit board |
| Admin | Everything, plus users, backups and the audit log |

Create users in the instructor panel (*Users*, admin only) or on the command line:
```bash
DATA_DIR=/var/lib/parashurama npm run user:add -w @parashurama/server -- nk.rao "Nk Arjun Rao" trainee 'TempPass-123' "AD Troop 2"
```

## Backups and restore

- Manual: instructor panel → *Back up database now*, or `npm run backup -w @parashurama/server`.
- Restore: stop the server, replace `DATA_DIR/parashurama.db` with a backup file, start the server.

## Security notes

- Passwords are stored as scrypt hashes; sessions are random tokens (only their SHA-256 is stored), 12-hour lifetime, `HttpOnly; SameSite=Strict` cookies (`Secure` under HTTPS).
- Login attempts are rate-limited per address and per username.
- Cross-origin state changes are refused; strict Content-Security-Policy with no `eval` (config validators are pre-compiled).
- Every drill is re-run on the server; a client cannot raise its own score. The decision log is SHA-256 chained.
- Logins, failed logins, config changes, user creation, flagged drills and backups are recorded in the audit log (`/api/admin/audit`).
- The server needs no internet access.

## Updating doctrine files directly

Advanced: edit `config/*.json`, run `npm run validate:config`, rebuild. If you change anything in `config/schema/`, also run `npm run gen:validators`.
