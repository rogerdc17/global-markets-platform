import os
import secrets
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENV_FILE = ROOT / ".env"
ENV_EXAMPLE = ROOT / ".env.example"

REQUIRED_PLACEHOLDERS = {
    "DP_INTERNAL_USERNAME": "",
    "DP_INTERNAL_PASSWORD": "",
    "DP_CLIENT_USERNAME": "",
    "DP_CLIENT_PASSWORD": "",
    "DP_CLIENT_ID": "client-001",
    "DP_CLIENT_NAME": "DP Alpha Client",
    "DP_AUTH_HOURS": "12",
    "DP_BIND_HOST": "127.0.0.1",
    "DP_PORT": "8000",
    "DP_DATABASE_FILE": "./data/dp_alpha.db",
    "DP_BACKUP_DIR": "./backups",
    "DP_BACKUP_HOURS": "24",
    "ALLOWED_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000,https://rogerdc17.github.io",
    "MARKET_YFINANCE_FALLBACK": "true",
}

def read_env(path: Path) -> tuple[list[str], dict[str, str]]:
    lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    values: dict[str, str] = {}
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip()
    return lines, values

def set_value(lines: list[str], key: str, value: str) -> list[str]:
    prefix = key + "="
    for i, line in enumerate(lines):
        if line.strip().startswith(prefix):
            lines[i] = f"{key}={value}"
            return lines
    lines.append(f"{key}={value}")
    return lines

def main() -> int:
    if sys.version_info < (3, 11):
        print("ERROR: DP Alpha requires Python 3.11 or newer.")
        return 1

    print(f"DP Alpha setup using Python {sys.version.split()[0]}")

    if not ENV_FILE.exists():
        if not ENV_EXAMPLE.exists():
            print("ERROR: .env.example is missing.")
            return 1
        ENV_FILE.write_text(ENV_EXAMPLE.read_text(encoding="utf-8"), encoding="utf-8")
        print("Created private .env from .env.example.")
    else:
        print("Existing .env found. It will be preserved.")

    lines, values = read_env(ENV_FILE)

    for key, default in REQUIRED_PLACEHOLDERS.items():
        if key not in values:
            lines = set_value(lines, key, default)
            values[key] = default

    if not values.get("DP_AUTH_SECRET"):
        secret = secrets.token_urlsafe(64)
        lines = set_value(lines, "DP_AUTH_SECRET", secret)
        values["DP_AUTH_SECRET"] = secret
        print("Generated DP_AUTH_SECRET automatically.")

    ENV_FILE.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    os.chdir(ROOT)
    try:
        from app.database import init_db
        init_db()
        print("SQLite database initialized.")
    except Exception as exc:
        print(f"ERROR: Could not initialize SQLite database: {exc}")
        return 1

    missing = [
        key for key in (
            "DP_INTERNAL_USERNAME",
            "DP_INTERNAL_PASSWORD",
            "DP_CLIENT_USERNAME",
            "DP_CLIENT_PASSWORD",
        )
        if not values.get(key)
    ]

    print()
    if missing:
        print("Setup is installed, but login credentials still need to be configured.")
        print("Open this file:")
        print(f"  {ENV_FILE}")
        print("Fill these values:")
        for key in missing:
            print(f"  {key}")
        print()
        print("Then run the start script again.")
    else:
        print("Configuration looks ready.")
        print("Run start-windows.bat on Windows or ./start-unix.sh on macOS/Linux.")

    print()
    print("Private files stay local and are ignored by Git:")
    print("  .env")
    print("  data/dp_alpha.db")
    print("  backups/")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
