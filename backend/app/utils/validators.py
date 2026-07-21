# Teaching guide: This file contains validators helper logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

import re
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from pydantic.
from pydantic import EmailStr, TypeAdapter


# Stores email adapter for the next steps.
EMAIL_ADAPTER = TypeAdapter(EmailStr)

# Stores phone pattern for the next steps.
PHONE_PATTERN = re.compile(
    r"^[0-9+\-()\s]{7,30}$",
)

# Stores company name pattern for the next steps.
COMPANY_NAME_PATTERN = re.compile(
    r"^[A-Za-z0-9][A-Za-z0-9\s&.,'()\-]{1,149}$",
)

# Stores person name pattern for the next steps.
PERSON_NAME_PATTERN = re.compile(
    r"^[A-Za-z][A-Za-z\s.'\-]{1,99}$",
)


# Runs normalize email logic.
def normalize_email(
    email: str,
) -> str:
    # Stores cleaned email for the next steps.
    cleaned_email = email.strip().lower()

    # Stores validated email for the next steps.
    validated_email = EMAIL_ADAPTER.validate_python(
        cleaned_email,
    )

    # Returns the completed value to the caller.
    return str(validated_email)


# Runs normalize phone number logic.
def normalize_phone_number(
    phone_number: str,
) -> str:
    # Stores cleaned phone for the next steps.
    cleaned_phone = re.sub(
        r"\s+",
        " ",
        phone_number.strip(),
    )

    # Checks whether this condition is true.
    if not PHONE_PATTERN.fullmatch(
        cleaned_phone,
    ):
        # Stops here and reports the problem.
        raise ValueError(
            "Enter a valid phone number.",
        )

    # Returns the completed value to the caller.
    return cleaned_phone


# Checks company name.
def validate_company_name(
    company_name: str,
) -> str:
    # Stores cleaned name for the next steps.
    cleaned_name = re.sub(
        r"\s+",
        " ",
        company_name.strip(),
    )

    # Checks whether this condition is true.
    if not COMPANY_NAME_PATTERN.fullmatch(
        cleaned_name,
    ):
        # Stops here and reports the problem.
        raise ValueError(
            "Company name contains invalid characters.",
        )

    # Returns the completed value to the caller.
    return cleaned_name


# Checks person name.
def validate_person_name(
    name: str,
) -> str:
    # Stores cleaned name for the next steps.
    cleaned_name = re.sub(
        r"\s+",
        " ",
        name.strip(),
    )

    # Checks whether this condition is true.
    if not PERSON_NAME_PATTERN.fullmatch(
        cleaned_name,
    ):
        # Stops here and reports the problem.
        raise ValueError(
            "Name contains invalid characters.",
        )

    # Returns the completed value to the caller.
    return cleaned_name


# Runs parse uuid logic.
def parse_uuid(
    value: str | UUID,
    *,
    field_name: str = "ID",
) -> UUID:
    # Checks whether this condition is true.
    if isinstance(value, UUID):
        # Returns the completed value to the caller.
        return value

    # Tries this work and watches for errors.
    try:
        # Returns the completed value to the caller.
        return UUID(value)
    # Handles the error raised by the work above.
    except (ValueError, TypeError) as exc:
        # Stops here and reports the problem.
        raise ValueError(
            f"{field_name} must be a valid UUID.",
        ) from exc


# Checks date range.
def validate_date_range(
    start_date: object | None,
    end_date: object | None,
) -> None:
    # Checks whether this condition is true.
    if (
        start_date is not None
        and end_date is not None
        and start_date > end_date
    ):
        # Stops here and reports the problem.
        raise ValueError(
            "Start date must not be later than end date.",
        )