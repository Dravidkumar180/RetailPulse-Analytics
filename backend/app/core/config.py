from functools import lru_cache
from typing import Any

from pydantic import (
    Field,
    PostgresDsn,
    SecretStr,
    field_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "RetailPulse Analytics"
    API_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    DEBUG: bool = False
    ENABLE_DOCS: bool = True
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = (
        "postgresql+psycopg://postgres:postgres"
        "@localhost:5432/retailpulse"
    )

    JWT_SECRET_KEY: SecretStr = Field(
        default=SecretStr(
            "change-this-secret-key-before-production"
        ),
    )
    JWT_REFRESH_SECRET_KEY: SecretStr = Field(
        default=SecretStr(
            "change-this-refresh-secret-before-production"
        ),
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    EXPOSE_PASSWORD_RESET_TOKEN: bool = False

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    FRONTEND_URL: str = "http://localhost:5173"

    DEFAULT_SUPER_ADMIN_EMAIL: str | None = None
    DEFAULT_SUPER_ADMIN_PASSWORD: SecretStr | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator(
        "CORS_ORIGINS",
        mode="before",
    )
    @classmethod
    def parse_cors_origins(
        cls,
        value: Any,
    ) -> list[str]:
        if isinstance(value, str):
            return [
                origin.strip()
                for origin in value.split(",")
                if origin.strip()
            ]

        if isinstance(value, list):
            return value

        raise ValueError(
            "CORS_ORIGINS must be a comma-separated string or list."
        )

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_mode(cls, value: Any) -> Any:
        """Accept common build-mode labels from host environments."""
        if isinstance(value, str):
            normalized = value.strip().lower()

            if normalized in {"debug", "development", "dev"}:
                return True

            if normalized in {"release", "production", "prod"}:
                return False

        return value

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_access_secret(
        cls,
        value: SecretStr,
    ) -> SecretStr:
        if len(value.get_secret_value()) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must contain at least 32 characters."
            )

        return value

    @field_validator("JWT_REFRESH_SECRET_KEY")
    @classmethod
    def validate_refresh_secret(
        cls,
        value: SecretStr,
    ) -> SecretStr:
        if len(value.get_secret_value()) < 32:
            raise ValueError(
                "JWT_REFRESH_SECRET_KEY must contain at least "
                "32 characters."
            )

        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
