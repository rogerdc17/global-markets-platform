import hmac
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from fastapi import Header, HTTPException
from pydantic import BaseModel

from app.config import settings

_attempts: dict[str, list[float]] = defaultdict(list)
WINDOW_SECONDS = 300
MAX_ATTEMPTS = 5
Role = Literal["internal", "client"]

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    expires_at: str
    username: str
    role: Role
    client_id: str | None = None
    display_name: str | None = None

class UserContext(BaseModel):
    username: str
    role: Role
    client_id: str | None = None
    display_name: str | None = None

def _require_auth_configured() -> None:
    if not settings.auth_configured:
        raise HTTPException(status_code=503, detail="Authentication is not configured.")

def _match(username: str, password: str) -> UserContext | None:
    if settings.internal_username and settings.internal_password:
        if (
            hmac.compare_digest(username, settings.internal_username)
            and hmac.compare_digest(password, settings.internal_password)
        ):
            return UserContext(username=username, role="internal", display_name="Internal Team")

    if settings.dp_client_username and settings.dp_client_password:
        if (
            hmac.compare_digest(username, settings.dp_client_username)
            and hmac.compare_digest(password, settings.dp_client_password)
        ):
            return UserContext(
                username=username,
                role="client",
                client_id=settings.dp_client_id,
                display_name=settings.dp_client_name,
            )
    return None

def authenticate(username: str, password: str) -> LoginResponse:
    _require_auth_configured()

    now_ts = time.time()
    key = username.strip().lower() or "anonymous"
    recent = [ts for ts in _attempts[key] if now_ts - ts < WINDOW_SECONDS]
    _attempts[key] = recent
    if len(recent) >= MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again in a few minutes.")

    user = _match(username, password)
    if not user:
        _attempts[key].append(now_ts)
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    _attempts.pop(key, None)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=settings.dp_auth_hours)

    token = jwt.encode(
        {
            "sub": user.username,
            "role": user.role,
            "client_id": user.client_id,
            "display_name": user.display_name,
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
        username=user.username,
        role=user.role,
        client_id=user.client_id,
        display_name=user.display_name,
    )

def require_user(authorization: str | None = Header(default=None)) -> UserContext:
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

    role = payload.get("role")
    if role not in ("internal", "client"):
        raise HTTPException(status_code=401, detail="Invalid session role.")

    return UserContext(
        username=str(payload.get("sub") or ""),
        role=role,
        client_id=payload.get("client_id"),
        display_name=payload.get("display_name"),
    )

def require_internal(user: UserContext) -> UserContext:
    if user.role != "internal":
        raise HTTPException(status_code=403, detail="Internal access required.")
    return user
