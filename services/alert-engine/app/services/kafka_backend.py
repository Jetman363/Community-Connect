"""Production Kafka event backend using aiokafka."""

from __future__ import annotations

import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from aiokafka.errors import TopicAlreadyExistsError
from aiokafka.structs import TopicPartition

from app.services.event_backend import EventBackend
from app.settings import settings

logger = logging.getLogger(__name__)


class KafkaBackend(EventBackend):
    def __init__(self) -> None:
        self._producer: AIOKafkaProducer | None = None
        self._started = False
        self._known_topics: set[str] = set()

    def _security_config(self) -> dict[str, Any]:
        cfg: dict[str, Any] = {}
        protocol = settings.kafka_security_protocol
        if protocol and protocol != "PLAINTEXT":
            cfg["security_protocol"] = protocol
        if settings.kafka_sasl_mechanism:
            cfg["sasl_mechanism"] = settings.kafka_sasl_mechanism
        if settings.kafka_sasl_username:
            cfg["sasl_plain_username"] = settings.kafka_sasl_username
            cfg["sasl_plain_password"] = settings.kafka_sasl_password
        if settings.kafka_ssl_cafile:
            import ssl

            ctx = ssl.create_default_context(cafile=settings.kafka_ssl_cafile)
            cfg["ssl_context"] = ctx
        return cfg

    def _producer_config(self) -> dict[str, Any]:
        cfg: dict[str, Any] = {
            "bootstrap_servers": settings.kafka_bootstrap_servers,
            "client_id": f"{settings.kafka_client_id}-producer",
            "acks": settings.kafka_producer_acks,
            "compression_type": settings.kafka_compression_type,
            "enable_idempotence": settings.kafka_enable_idempotence,
            "linger_ms": settings.kafka_producer_linger_ms,
            "max_batch_size": settings.kafka_producer_max_batch_size,
        }
        cfg.update(self._security_config())
        return cfg

    def _consumer_config(self) -> dict[str, Any]:
        cfg: dict[str, Any] = {
            "bootstrap_servers": settings.kafka_bootstrap_servers,
            "client_id": f"{settings.kafka_client_id}-consumer",
            "enable_auto_commit": False,
            "auto_offset_reset": "earliest",
            "group_id": settings.kafka_consumer_group,
        }
        cfg.update(self._security_config())
        return cfg

    async def start(self) -> None:
        if self._started:
            return
        self._producer = AIOKafkaProducer(**self._producer_config())
        await self._producer.start()
        self._started = True
        logger.info("Kafka producer started", extra={"bootstrap": settings.kafka_bootstrap_servers})

    async def stop(self) -> None:
        if self._producer is not None:
            await self._producer.stop()
            self._producer = None
        self._started = False

    async def health_check(self) -> dict[str, Any]:
        admin: AIOKafkaAdminClient | None = None
        try:
            admin = AIOKafkaAdminClient(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                client_id=f"{settings.kafka_client_id}-admin",
                **self._security_config(),
            )
            await admin.start()
            cluster = await admin.describe_cluster()
            broker_count = len(cluster.brokers)
            if broker_count == 0:
                return {"status": "error", "detail": "no brokers available"}
            return {
                "status": "ok",
                "backend": "kafka",
                "brokers": broker_count,
                "controller": cluster.controller,
            }
        except Exception as exc:  # noqa: BLE001
            return {"status": "error", "backend": "kafka", "detail": str(exc)}
        finally:
            if admin is not None:
                await admin.stop()

    async def ensure_topic(self, topic: str) -> None:
        if topic in self._known_topics:
            return
        admin: AIOKafkaAdminClient | None = None
        try:
            admin = AIOKafkaAdminClient(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                client_id=f"{settings.kafka_client_id}-admin",
                **self._security_config(),
            )
            await admin.start()
            existing = await admin.list_topics()
            if topic in existing:
                self._known_topics.add(topic)
                return
            if not settings.kafka_auto_create_topics:
                raise RuntimeError(f"Kafka topic '{topic}' does not exist and auto-create is disabled")
            await admin.create_topics(
                [
                    NewTopic(
                        name=topic,
                        num_partitions=settings.kafka_topic_partitions,
                        replication_factor=settings.kafka_replication_factor,
                    )
                ],
                validate_only=False,
            )
            self._known_topics.add(topic)
        except TopicAlreadyExistsError:
            self._known_topics.add(topic)
        finally:
            if admin is not None:
                await admin.stop()

    async def publish(self, stream: str, message: dict[str, Any]) -> None:
        if not self._started or self._producer is None:
            await self.start()
        assert self._producer is not None
        await self.ensure_topic(stream)
        payload = json.dumps(message, separators=(",", ":")).encode("utf-8")
        await self._producer.send_and_wait(stream, value=payload, headers=[("content-type", b"application/json")])

    async def read(self, stream: str, last_id: str, count: int) -> list[dict[str, Any]]:
        await self.ensure_topic(stream)
        consumer = AIOKafkaConsumer(stream, **self._consumer_config())
        await consumer.start()
        try:
            partitions = consumer.partitions_for_topic(stream)
            if not partitions:
                return []
            topic_partitions = sorted(TopicPartition(stream, p) for p in partitions)
            consumer.assign(topic_partitions)
            if last_id == "0":
                await consumer.seek_to_beginning(*topic_partitions)
            else:
                start_offset = int(last_id) + 1 if last_id.isdigit() else 0
                for tp in topic_partitions:
                    await consumer.seek(tp, start_offset)
            collected: list[dict[str, Any]] = []
            idle_rounds = 0
            while len(collected) < count and idle_rounds < 3:
                batch = await consumer.getmany(timeout_ms=settings.kafka_read_timeout_ms, max_records=count - len(collected))
                if not batch:
                    idle_rounds += 1
                    continue
                idle_rounds = 0
                for records in batch.values():
                    for record in records:
                        collected.append({"id": str(record.offset), "data": self._parse_record(record.value)})
                        if len(collected) >= count:
                            break
            collected.sort(key=lambda item: int(item["id"]))
            return collected[:count]
        finally:
            await consumer.stop()

    @staticmethod
    def _parse_record(raw: bytes | None) -> dict[str, Any]:
        if not raw:
            return {}
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return {"raw": raw.decode("utf-8", errors="replace")}
        return parsed if isinstance(parsed, dict) else {"value": parsed}
