import re
import secrets
import string

from app.core.constants import (
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
)
from app.core.security import (
    hash_password as core_hash_password,
)
from app.core.security import (
    verify_password as core_verify_password,
)


UPPERCASE_PATTERN = re.compile(r"[A-Z]")
LOWERCASE_PATTERN = re.compile(r"[a-z]")
NUMBER_PATTERN = re.compile(r"\d")
SPECIAL_CHARACTER_PATTERN = re.compile(
    r"[^A-Za-z0-9]",
)


def validate_password_strength(
    password: str,
) -> list[str]:
    """
    Return password validation errors.

    An empty list means the password is valid.
    """
    errors: list[str] = []

    password_bytes = password.encode("utf-8")

    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(
            "Password must contain at least "
            f"{MIN_PASSWORD_LENGTH} characters.",
        )

    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        errors.append(
            "Password must not exceed "
            f"{MAX_PASSWORD_LENGTH} UTF-8 bytes.",
        )

    if not UPPERCASE_PATTERN.search(password):
        errors.append(
            "Password must contain an uppercase letter.",
        )

    if not LOWERCASE_PATTERN.search(password):
        errors.append(
            "Password must contain a lowercase letter.",
        )

    if not NUMBER_PATTERN.search(password):
        errors.append(
            "Password must contain a number.",
        )

    if not SPECIAL_CHARACTER_PATTERN.search(password):
        errors.append(
            "Password must contain a special character.",
        )

    return errors


def ensure_strong_password(
    password: str,
) -> None:
    errors = validate_password_strength(password)

    if errors:
        raise ValueError(" ".join(errors))


def hash_password(
    password: str,
) -> str:
    ensure_strong_password(password)

    return core_hash_password(password)


def verify_password(
    plain_password: str,
    password_hash: str,
) -> bool:
    return core_verify_password(
        plain_password,
        password_hash,
    )


def generate_temporary_password(
    length: int = 16,
) -> str:
    if length < MIN_PASSWORD_LENGTH:
        raise ValueError(
            "Temporary password length must be at least "
            f"{MIN_PASSWORD_LENGTH}.",
        )

    alphabet = (
        string.ascii_letters
        + string.digits
        + "!@#$%^&*"
    )

    while True:
        password = "".join(
            secrets.choice(alphabet)
            for _ in range(length)
        )

        if not validate_password_strength(password):
            return password