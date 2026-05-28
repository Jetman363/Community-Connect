"""OpenTelemetry tracing hooks — wire exporter in production deployments."""

import logging
from contextlib import contextmanager
from typing import Iterator

logger = logging.getLogger(__name__)


@contextmanager
def trace_span(name: str, attributes: dict | None = None) -> Iterator[None]:
    logger.debug("trace span start", extra={"span": name, "attributes": attributes or {}})
    try:
        yield
    finally:
        logger.debug("trace span end", extra={"span": name})
