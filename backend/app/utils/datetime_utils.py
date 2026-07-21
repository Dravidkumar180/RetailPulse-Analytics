# Teaching guide: This file contains datetime utils helper logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import (
    UTC,
    date,
    datetime,
    time,
    timedelta,
)


# Runs utc now logic.
def utc_now() -> datetime:
    # Returns the completed value to the caller.
    return datetime.now(UTC)


# Runs ensure utc logic.
def ensure_utc(
    value: datetime,
) -> datetime:
    # Checks whether this condition is true.
    if value.tzinfo is None:
        # Returns the completed value to the caller.
        return value.replace(tzinfo=UTC)

    # Returns the completed value to the caller.
    return value.astimezone(UTC)


# Checks expired.
def is_expired(
    expires_at: datetime,
    *,
    current_time: datetime | None = None,
) -> bool:
    # Stores now for the next steps.
    now = ensure_utc(
        current_time or utc_now(),
    )

    # Returns the completed value to the caller.
    return ensure_utc(expires_at) <= now


# Adds minutes.
def add_minutes(
    minutes: int,
    *,
    from_datetime: datetime | None = None,
) -> datetime:
    # Stores starting time for the next steps.
    starting_time = ensure_utc(
        from_datetime or utc_now(),
    )

    # Returns the completed value to the caller.
    return starting_time + timedelta(
        minutes=minutes,
    )


# Adds days.
def add_days(
    days: int,
    *,
    from_datetime: datetime | None = None,
) -> datetime:
    # Stores starting time for the next steps.
    starting_time = ensure_utc(
        from_datetime or utc_now(),
    )

    # Returns the completed value to the caller.
    return starting_time + timedelta(
        days=days,
    )


# Runs start of day logic.
def start_of_day(
    value: date,
) -> datetime:
    # Returns the completed value to the caller.
    return datetime.combine(
        value,
        time.min,
        tzinfo=UTC,
    )


# Runs end of day logic.
def end_of_day(
    value: date,
) -> datetime:
    # Returns the completed value to the caller.
    return datetime.combine(
        value,
        time.max,
        tzinfo=UTC,
    )


# Runs to iso string logic.
def to_iso_string(
    value: datetime | None,
) -> str | None:
    # Checks whether this condition is true.
    if value is None:
        # Returns the completed value to the caller.
        return None

    # Returns the completed value to the caller.
    return ensure_utc(value).isoformat()


# Runs calculate total pages logic.
def calculate_total_pages(
    total_items: int,
    page_size: int,
) -> int:
    # Checks whether this condition is true.
    if page_size <= 0:
        # Stops here and reports the problem.
        raise ValueError(
            "Page size must be greater than zero.",
        )

    # Checks whether this condition is true.
    if total_items <= 0:
        # Returns the completed value to the caller.
        return 0

    # Returns the completed value to the caller.
    return (
        total_items + page_size - 1
    ) // page_size