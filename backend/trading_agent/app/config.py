from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-5"
    market_api_base_url: str = ""
    allowed_origins: str = "https://rogerdc17.github.io,http://localhost:3000"

    dp_login_username: str = ""
    dp_login_password: str = ""
    dp_auth_secret: str = ""
    dp_auth_hours: int = 12

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]

    @property
    def auth_configured(self) -> bool:
        return bool(self.dp_login_username and self.dp_login_password and self.dp_auth_secret)

settings = Settings()
