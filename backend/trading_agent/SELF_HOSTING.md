# DP Alpha self-hosted server

DP Alpha can run on any Windows, macOS or Linux computer while the frontend remains on GitHub Pages.

## Architecture

```text
Authorized users
      |
      v
GitHub Pages frontend
      |
      | HTTPS API requests
      v
Stable Cloudflare Tunnel hostname
      |
      v
Local computer: 127.0.0.1:8000
      |
      v
FastAPI + SQLite
      |
      +-- client records
      +-- transaction records
      +-- research journal
      +-- audit log
      +-- TradingAgent
```

DP Alpha has no order-execution endpoint. BUY/SELL records describe trades completed outside this application.

## What stays on the server computer

Never commit these files:

- `.env`
- `data/dp_alpha.db`
- `backups/`
- provider API keys

The database is portable. To move DP Alpha to another computer, copy `data/dp_alpha.db` and the private `.env` file securely.

## 1. Install prerequisites

Install:

- Git
- Python 3.11 or newer
- Cloudflare Tunnel (`cloudflared`)

Clone the repository and enter:

```text
backend/trading_agent
```

## 2. First start

### Windows

Double-click:

```text
start-windows.bat
```

### macOS / Linux

```bash
chmod +x start-unix.sh
./start-unix.sh
```

On first run the script:

1. creates `.venv`
2. installs Python dependencies
3. copies `.env.example` to `.env`
4. asks you to edit the private settings

## 3. Configure .env

At minimum set:

```text
DP_INTERNAL_USERNAME=
DP_INTERNAL_PASSWORD=

DP_CLIENT_USERNAME=
DP_CLIENT_PASSWORD=
DP_CLIENT_ID=client-001
DP_CLIENT_NAME=

DP_AUTH_SECRET=
ALLOWED_ORIGINS=https://rogerdc17.github.io
```

Generate a signing secret locally:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Do not share the generated secret or commit the `.env` file.

Optional integrations:

```text
ANTHROPIC_API_KEY=
MARKET_API_BASE_URL=
```

## 4. Verify locally

Start the server and open:

```text
http://127.0.0.1:8000/health
```

The response should include:

```json
{
  "ok": true,
  "executionEnabled": false,
  "storage": "sqlite",
  "selfHosted": true
}
```

The backend intentionally binds to `127.0.0.1` by default. Do not expose port 8000 directly through the home router.

## 5. Create a stable Cloudflare Tunnel

For a permanent GitHub Pages integration, use a named Cloudflare Tunnel with a stable HTTPS hostname pointing to:

```text
http://127.0.0.1:8000
```

Use tunnel name:

```text
dp-alpha
```

Once the named tunnel is configured, start it with:

### Windows

```text
start-tunnel-windows.bat
```

### macOS / Linux

```bash
chmod +x start-tunnel-unix.sh
./start-tunnel-unix.sh
```

A temporary/random tunnel URL is useful for testing, but it is not ideal for the GitHub Pages production variable because the URL can change after restart.

## 6. Connect GitHub Pages

In the GitHub repository:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
```

Set:

```text
TRADING_AGENT_API_BASE_URL=https://YOUR-STABLE-API-HOSTNAME
```

Then redeploy GitHub Pages.

The public frontend only receives the API hostname. Passwords, JWT signing keys, SQLite data and provider secrets remain on the server computer.

## 7. Backups

Manual backup:

```bash
python backup.py
```

Backups are written to:

```text
backups/
```

The utility retains the newest 30 database backups.

You can schedule `python backup.py` daily using Windows Task Scheduler, cron, or launchd.

## 8. Automatic startup

For a dedicated always-on computer, configure two startup jobs:

1. `python run_server.py`
2. `cloudflared tunnel run dp-alpha`

On Windows use Task Scheduler and choose "Run whether user is logged on or not".

On Linux use systemd.

On macOS use launchd.

Keep the computer configured to avoid sleeping while it is acting as the DP Alpha server.

## Moving to another computer

1. Clone the repository on the new computer.
2. Copy the old private `.env`.
3. Copy `data/dp_alpha.db`.
4. Install prerequisites.
5. Start FastAPI.
6. Move/re-authenticate the named Cloudflare Tunnel credentials.
7. Start the tunnel.

The GitHub Pages URL does not need to change if the stable tunnel hostname stays the same.
