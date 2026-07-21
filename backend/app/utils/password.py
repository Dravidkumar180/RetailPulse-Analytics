# Teaching guide: This file contains password helper logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

import re
# Imports secrets for use below.
import secrets
# Imports string for use below.
import string

# Imports the needed names from app.core.constants.
from app.core.constants import (
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
)
# Imports the needed names from app.core.security.
from app.core.security import (
    hash_password as core_hash_password,
)
# Imports the needed names from app.core.security.
from app.core.security import (
    verify_password as core_verify_password,
)


# Stores uppercase pattern for the next steps.
UPPERCASE_PATTERN = re.compile(r"[A-Z]")
# Stores lowercase pattern for the next steps.
LOWERCASE_PATTERN = re.compile(r"[a-z]")
# Stores number pattern for the next steps.
NUMBER_PATTERN = re.compile(r"\d")
# Stores special character pattern for the next steps.
SPECIAL_CHARACTER_PATTERN = re.compile(
    r"[^A-Za-z0-9]",
)


# Checks password strength.
def validate_password_strength(
    password: str,
) -> list[str]:
    """
    Return password validation errors.

    An empty list means the password is valid.
    """
    # Stores errors for the next steps.
    errors: list[str] = []

    # Stores password bytes for the next steps.
    password_bytes = password.encode("utf-8")

    # Checks whether this condition is true.
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(
            "Password must contain at least "
            f"{MIN_PASSWORD_LENGTH} characters.",
        )

    # Checks whether this condition is true.
    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        errors.append(
            "Password must not exceed "
            f"{MAX_PASSWORD_LENGTH} UTF-8 bytes.",
        )

    # Checks whether this condition is true.
    if not UPPERCASE_PATTERN.search(password):
        errors.append(
            "Password must contain an uppercase letter.",
        )

    # Checks whether this condition is true.
    if not LOWERCASE_PATTERN.search(password):
        errors.append(
            "Password must contain a lowercase letter.",
        )

    # Checks whether this condition is true.
    if not NUMBER_PATTERN.search(password):
        errors.append(
            "Password must contain a number.",
        )

    # Checks whether this condition is true.
    if not SPECIAL_CHARACTER_PATTERN.search(password):
        errors.append(
            "Password must contain a special character.",
        )

    # Returns the completed value to the caller.
    return errors


# Runs ensure strong password logic.
def ensure_strong_password(
    password: str,
) -> None:
    # Stores errors for the next steps.
    errors = validate_password_strength(password)

    # Checks whether this condition is true.
    if errors:
        # Stops here and reports the problem.
        raise ValueError(" ".join(errors))


# Checks hash password.
def hash_password(
    password: str,
) -> str:
    ensure_strong_password(password)

    # Returns the completed value to the caller.
    return core_hash_password(password)


# Checks password.
def verify_password(
    plain_password: str,
    password_hash: str,
) -> bool:
    # Returns the completed value to the caller.
    return core_verify_password(
        plain_password,
        password_hash,
    )


# Runs generate temporary password logic.
def generate_temporary_password(
    length: int = 16,
) -> str:
    # Checks whether this condition is true.
    if length < MIN_PASSWORD_LENGTH:
        # Stops here and reports the problem.
        raise ValueError(
            "Temporary password length must be at least "
            f"{MIN_PASSWORD_LENGTH}.",
        )

    # Stores alphabet for the next steps.
    alphabet = (
        string.ascii_letters
        + string.digits
        + "!@#$%^&*"
    )

    # Repeats this work for the matching values.
    while True:
        # Stores password for the next steps.
        password = "".join(
            secrets.choice(alphabet)
            for _ in range(length)
        )

        # Checks whether this condition is true.
        if not validate_password_strength(password):
            # Returns the completed value to the caller.
            return password