# Teaching guide: This file contains config application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from functools import lru_cache
# Imports the needed names from typing.
from typing import Any

# Imports the needed names from pydantic.
from pydantic import (
    Field,
    PostgresDsn,
    SecretStr,
    field_validator,
)
# Imports the needed names from pydantic_settings.
from pydantic_settings import BaseSettings, SettingsConfigDict


# Groups settings behavior.
class Settings(BaseSettings):
    # Stores app name for the next steps.
    APP_NAME: str = "RetailPulse Analytics"
    # Stores api version for the next steps.
    API_VERSION: str = "1.0.0"
    # Stores api v1 prefix for the next steps.
    API_V1_PREFIX: str = "/api/v1"

    # Stores debug for the next steps.
    DEBUG: bool = False
    # Stores enable docs for the next steps.
    ENABLE_DOCS: bool = True
    # Stores environment for the next steps.
    ENVIRONMENT: str = "development"

    # Stores database url for the next steps.
    DATABASE_URL: str = (
        "postgresql+psycopg://postgres:postgres"
        "@localhost:5432/retailpulse"
    )

    # Stores jwt secret key for the next steps.
    JWT_SECRET_KEY: SecretStr = Field(
        default=SecretStr(
            "change-this-secret-key-before-production"
        ),
    )
    # Stores jwt refresh secret key for the next steps.
    JWT_REFRESH_SECRET_KEY: SecretStr = Field(
        default=SecretStr(
            "change-this-refresh-secret-before-production"
        ),
    )
    # Stores jwt algorithm for the next steps.
    JWT_ALGORITHM: str = "HS256"
    # Stores access token expire minutes for the next steps.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    # Stores refresh token expire days for the next steps.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # Stores password reset token expire minutes for the next steps.
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    # Stores expose password reset token for the next steps.
    EXPOSE_PASSWORD_RESET_TOKEN: bool = False

    # Stores cors origins for the next steps.
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Stores frontend url for the next steps.
    FRONTEND_URL: str = "http://localhost:5173"

    # Stores default super admin email for the next steps.
    DEFAULT_SUPER_ADMIN_EMAIL: str | None = None
    # Stores default super admin password for the next steps.
    DEFAULT_SUPER_ADMIN_PASSWORD: SecretStr | None = None

    # Stores model config for the next steps.
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
    # Runs parse cors origins logic.
    @classmethod
    def parse_cors_origins(
        cls,
        value: Any,
    ) -> list[str]:
        # Checks whether this condition is true.
        if isinstance(value, str):
            # Returns the completed value to the caller.
            return [
                origin.strip()
                for origin in value.split(",")
                if origin.strip()
            ]

        # Checks whether this condition is true.
        if isinstance(value, list):
            # Returns the completed value to the caller.
            return value

        # Stops here and reports the problem.
        raise ValueError(
            "CORS_ORIGINS must be a comma-separated string or list."
        )

    # Runs parse debug mode logic.
    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_mode(cls, value: Any) -> Any:
        """Accept common build-mode labels from host environments."""
        # Checks whether this condition is true.
        if isinstance(value, str):
            # Stores normalized for the next steps.
            normalized = value.strip().lower()

            # Checks whether this condition is true.
            if normalized in {"debug", "development", "dev"}:
                # Returns the completed value to the caller.
                return True

            # Checks whether this condition is true.
            if normalized in {"release", "production", "prod"}:
                # Returns the completed value to the caller.
                return False

        # Returns the completed value to the caller.
        return value

    # Checks access secret.
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_access_secret(
        cls,
        value: SecretStr,
    ) -> SecretStr:
        # Checks whether this condition is true.
        if len(value.get_secret_value()) < 32:
            # Stops here and reports the problem.
            raise ValueError(
                "JWT_SECRET_KEY must contain at least 32 characters."
            )

        # Returns the completed value to the caller.
        return value

    # Checks refresh secret.
    @field_validator("JWT_REFRESH_SECRET_KEY")
    @classmethod
    def validate_refresh_secret(
        cls,
        value: SecretStr,
    ) -> SecretStr:
        # Checks whether this condition is true.
        if len(value.get_secret_value()) < 32:
            # Stops here and reports the problem.
            raise ValueError(
                "JWT_REFRESH_SECRET_KEY must contain at least "
                "32 characters."
            )

        # Returns the completed value to the caller.
        return value


# Gets settings.
@lru_cache
def get_settings() -> Settings:
    # Returns the completed value to the caller.
    return Settings()


# Stores settings for the next steps.
settings = get_settings()
