import hmac
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Header, HTTPException
from pydantic import BaseModel

from app.config import settings

_attempts: dict[str, list[float]] = defaultdict(list)
WINDOW_SECONDS = 300
MAX_ATTEMPTS = 5

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_at: str
    username: str


def _require_auth_configured() -> None:
    if not settings.auth_configured:
        raise HTTPException(status_code=503, detail="Authentication is not configured.")


def authenticate(username: str, password: str) -> LoginResponse:
    _require_auth_configured()

    now_ts = time.time()
    key = username.strip().lower() or "anonymous"
    recent = [ts for ts in _attempts[key] if now_ts - ts < WINDOW_SECONDS]
    _attempts[key] = recent
    if len(recent) >= MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again in a few minutes.")

    valid_user = hmac.compare_digest(username, settings.dp_login_username)
    valid_password = hmac.compare_digest(password, settings.dp_login_password)

    if not (valid_user and valid_password):
        _attempts[key].append(now_ts)
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    _attempts.pop(key, None)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=settings.dp_auth_hours)

    token = jwt.encode(
        {
            "sub": username,
            "iat": int(now.timestamp()),
            "exp": int(expires.timestamp()),
            "aud": "dp-alpha-terminal",
        },
        settings.dp_auth_secret,
        algorithm="HS256",
    )

    return LoginResponse(
        token=token,
        expires_at=expires.isoformat(),
        username=username,
    )


def require_user(authorization: str | None = Header(default=None)) -> str:
    _require_auth_configured()

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            settings.dp_auth_secret,
            algorithms=["HS256"],
            audience="dp-alpha-terminal",
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Session expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid session.") from exc

    return str(payload.get("sub") or "")
