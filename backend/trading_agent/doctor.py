import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    if sys.version_info < (3, 11):
        errors.append("Python 3.11 or newer is required.")

    env_file = ROOT / ".env"
    if not env_file.exists():
        errors.append(".env does not exist. Run the setup script first.")
    else:
        values: dict[str, str] = {}
        for line in env_file.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            values[key.strip()] = value.strip()

        for key in (
            "DP_INTERNAL_USERNAME",
            "DP_INTERNAL_PASSWORD",
            "DP_CLIENT_USERNAME",
            "DP_CLIENT_PASSWORD",
            "DP_AUTH_SECRET",
        ):
            if not values.get(key):
                errors.append(f"{key} is not configured in .env.")

        if not values.get("ANTHROPIC_API_KEY"):
            warnings.append("ANTHROPIC_API_KEY is blank: TradingAgent AI will be unavailable.")
        if not values.get("MARKET_API_BASE_URL"):
            warnings.append("MARKET_API_BASE_URL is blank: live market backend data will be unavailable.")

    db = ROOT / "data" / "dp_alpha.db"
    if not db.exists():
        warnings.append("SQLite database does not exist yet; it will be created at startup.")

    if errors:
        print("DP Alpha configuration check FAILED")
        for item in errors:
            print(f"  ERROR: {item}")
        if warnings:
            for item in warnings:
                print(f"  WARNING: {item}")
        return 1

    print("DP Alpha configuration check PASSED")
    for item in warnings:
        print(f"  WARNING: {item}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
