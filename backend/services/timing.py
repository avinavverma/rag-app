import logging
import time
from contextlib import contextmanager
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger("margin")


@contextmanager
def timed(operation: str, **context: Any):
    """Log operation start and completion with duration_ms."""
    ctx = " ".join(f"{k}={v}" for k, v in context.items() if v is not None)
    prefix = f"{operation}" + (f" {ctx}" if ctx else "")
    logger.info("%s started", prefix)
    start = time.perf_counter()
    try:
        yield
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.exception("%s failed duration_ms=%.1f", prefix, elapsed_ms)
        raise
    else:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info("%s completed duration_ms=%.1f", prefix, elapsed_ms)