from datetime import (
    UTC,
    date,
    datetime,
    time,
    timedelta,
)


def utc_now() -> datetime:
    return datetime.now(UTC)


def ensure_utc(
    value: datetime,
) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def is_expired(
    expires_at: datetime,
    *,
    current_time: datetime | None = None,
) -> bool:
    now = ensure_utc(
        current_time or utc_now(),
    )

    return ensure_utc(expires_at) <= now


def add_minutes(
    minutes: int,
    *,
    from_datetime: datetime | None = None,
) -> datetime:
    starting_time = ensure_utc(
        from_datetime or utc_now(),
    )

    return starting_time + timedelta(
        minutes=minutes,
    )


def add_days(
    days: int,
    *,
    from_datetime: datetime | None = None,
) -> datetime:
    starting_time = ensure_utc(
        from_datetime or utc_now(),
    )

    return starting_time + timedelta(
        days=days,
    )


def start_of_day(
    value: date,
) -> datetime:
    return datetime.combine(
        value,
        time.min,
        tzinfo=UTC,
    )


def end_of_day(
    value: date,
) -> datetime:
    return datetime.combine(
        value,
        time.max,
        tzinfo=UTC,
    )


def to_iso_string(
    value: datetime | None,
) -> str | None:
    if value is None:
        return None

    return ensure_utc(value).isoformat()


def calculate_total_pages(
    total_items: int,
    page_size: int,
) -> int:
    if page_size <= 0:
        raise ValueError(
            "Page size must be greater than zero.",
        )

    if total_items <= 0:
        return 0

    return (
        total_items + page_size - 1
    ) // page_size