import asyncio
import logging

from alembic import command
from alembic.config import Config

from app.settings import settings

logger = logging.getLogger(__name__)


def _sync_database_url() -> str:
    url = settings.integration_db_url
    if "+asyncpg" in url:
        return url.replace("+asyncpg", "+psycopg2")
    if "+aiosqlite" in url:
        return url.replace("+aiosqlite", "")
    return url


def run_migrations() -> None:
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", _sync_database_url())
    command.upgrade(cfg, "head")
    logger.info("Alembic migrations applied")
