# Teaching guide: This file contains database shared dependencies.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import Depends
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.database.
from app.core.database import get_db


# Stores database session for the next steps.
DatabaseSession = Annotated[
    Session,
    Depends(get_db),
]