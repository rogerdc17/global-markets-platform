from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-5"
    market_api_base_url: str = ""
    allowed_origins: str = "https://rogerdc17.github.io,http://localhost:3000"

    # Temporary role-based users. These remain server-side only.
    dp_internal_username: str = ""
    dp_internal_password: str = ""
    dp_client_username: str = ""
    dp_client_password: str = ""
    dp_client_id: str = "client-001"
    dp_client_name: str = "DP Alpha Client"

    # Legacy internal login fallback.
    dp_login_username: str = ""
    dp_login_password: str = ""

    dp_auth_secret: str = ""
    dp_auth_hours: int = 12

    # Portable self-hosted runtime.
    dp_database_file: str = "./data/dp_alpha.db"
    dp_legacy_data_file: str = "./data/client_portfolios.json"
    dp_backup_dir: str = "./backups"
    dp_backup_hours: int = 24
    dp_bind_host: str = "127.0.0.1"
    dp_port: int = 8000

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]

    @property
    def internal_username(self) -> str:
        return self.dp_internal_username or self.dp_login_username

    @property
    def internal_password(self) -> str:
        return self.dp_internal_password or self.dp_login_password

    @property
    def auth_configured(self) -> bool:
        internal_ok = bool(self.internal_username and self.internal_password)
        client_ok = bool(self.dp_client_username and self.dp_client_password)
        return bool(self.dp_auth_secret and (internal_ok or client_ok))

settings = Settings()
