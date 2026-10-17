"""PostgreSQL Connection Pool and Checkpointer Configuration for QuoteFlow AI.

Adheres strictly to the 3 production rules:
1. Configures `autocommit=True` and `row_factory=dict_row`.
2. Provides one-time setup runner for LangGraph checkpoint tables.
3. Provides context-managed DB access (`get_db_connection()`) so queries in
   Node 2 and Node 4 release connections immediately and NEVER hold transactions
   across LLM calls.
"""

from contextlib import contextmanager
from typing import Generator
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from core.config import settings

# Global ConnectionPool for Neon DB
_pool: ConnectionPool | None = None

def get_connection_pool() -> ConnectionPool:
    """Returns the singleton psycopg ConnectionPool with required kwargs."""
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=settings.database_url,
            min_size=1,
            max_size=10,
            open=True,
            kwargs={
                "autocommit": True,
                "row_factory": dict_row,
            }
        )
    return _pool

import atexit

def close_connection_pool() -> None:
    """Closes the connection pool cleanly on process exit."""
    global _pool
    if _pool is not None and not _pool.closed:
        try:
            _pool.close()
        except Exception:
            pass
        _pool = None

atexit.register(close_connection_pool)

@contextmanager
def get_db_connection() -> Generator[psycopg.Connection, None, None]:
    """Context manager for short-lived DB queries.
    
    Ensures connections are returned to the pool immediately after queries,
    preventing connection starvation during LLM calls.
    """
    pool = get_connection_pool()
    with pool.connection() as conn:
        yield conn

def get_postgres_checkpointer() -> PostgresSaver:
    """Creates a PostgresSaver checkpointer instance backed by the ConnectionPool."""
    pool = get_connection_pool()
    return PostgresSaver(conn=pool)

def setup_checkpointer() -> None:
    """One-time initialization of LangGraph checkpoint tables."""
    checkpointer = get_postgres_checkpointer()
    checkpointer.setup()
