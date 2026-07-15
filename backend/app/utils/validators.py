import re
from uuid import UUID

from pydantic import EmailStr, TypeAdapter


EMAIL_ADAPTER = TypeAdapter(EmailStr)

PHONE_PATTERN = re.compile(
    r"^[0-9+\-()\s]{7,30}$",
)

COMPANY_NAME_PATTERN = re.compile(
    r"^[A-Za-z0-9][A-Za-z0-9\s&.,'()\-]{1,149}$",
)

PERSON_NAME_PATTERN = re.compile(
    r"^[A-Za-z][A-Za-z\s.'\-]{1,99}$",
)


def normalize_email(
    email: str,
) -> str:
    cleaned_email = email.strip().lower()

    validated_email = EMAIL_ADAPTER.validate_python(
        cleaned_email,
    )

    return str(validated_email)


def normalize_phone_number(
    phone_number: str,
) -> str:
    cleaned_phone = re.sub(
        r"\s+",
        " ",
        phone_number.strip(),
    )

    if not PHONE_PATTERN.fullmatch(
        cleaned_phone,
    ):
        raise ValueError(
            "Enter a valid phone number.",
        )

    return cleaned_phone


def validate_company_name(
    company_name: str,
) -> str:
    cleaned_name = re.sub(
        r"\s+",
        " ",
        company_name.strip(),
    )

    if not COMPANY_NAME_PATTERN.fullmatch(
        cleaned_name,
    ):
        raise ValueError(
            "Company name contains invalid characters.",
        )

    return cleaned_name


def validate_person_name(
    name: str,
) -> str:
    cleaned_name = re.sub(
        r"\s+",
        " ",
        name.strip(),
    )

    if not PERSON_NAME_PATTERN.fullmatch(
        cleaned_name,
    ):
        raise ValueError(
            "Name contains invalid characters.",
        )

    return cleaned_name


def parse_uuid(
    value: str | UUID,
    *,
    field_name: str = "ID",
) -> UUID:
    if isinstance(value, UUID):
        return value

    try:
        return UUID(value)
    except (ValueError, TypeError) as exc:
        raise ValueError(
            f"{field_name} must be a valid UUID.",
        ) from exc


def validate_date_range(
    start_date: object | None,
    end_date: object | None,
) -> None:
    if (
        start_date is not None
        and end_date is not None
        and start_date > end_date
    ):
        raise ValueError(
            "Start date must not be later than end date.",
        )