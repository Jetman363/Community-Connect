"""CJIS-conscious field encryption for CJI at rest."""

from __future__ import annotations

import base64
import json
from typing import Any

from cryptography.fernet import Fernet

from app.settings import settings

CJI_FIELD_KEYS = frozenset({
    "date_of_birth",
    "dob",
    "driver_license",
    "phone_number",
    "email_address",
    "home_address",
    "address",
    "phone",
    "email",
    "ssn",
    "state_id",
})


def _fernet() -> Fernet:
    key = settings.cji_encryption_key
    if len(key) < 32:
        key = (key * 4)[:32]
    return Fernet(base64.urlsafe_b64encode(key[:32].encode()))


def encrypt_value(value: str) -> str:
    if not value:
        return value
    return _fernet().encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    if not token or not token.startswith("gAAAA"):
        return token
    try:
        return _fernet().decrypt(token.encode()).decode()
    except Exception:  # noqa: BLE001
        return "[encrypted]"


def protect_cji_fields(data: Any) -> Any:
    if isinstance(data, dict):
        out: dict[str, Any] = {}
        for k, v in data.items():
            if k in CJI_FIELD_KEYS and isinstance(v, str) and v and not v.startswith("gAAAA"):
                out[k] = encrypt_value(v)
            else:
                out[k] = protect_cji_fields(v)
        return out
    if isinstance(data, list):
        return [protect_cji_fields(item) for item in data]
    return data


def reveal_cji_fields(data: Any, authorized: bool) -> Any:
    if not authorized:
        if isinstance(data, dict):
            return {k: ("[CJI RESTRICTED]" if k in CJI_FIELD_KEYS and v else v) for k, v in data.items()}
        return data
    if isinstance(data, dict):
        out: dict[str, Any] = {}
        for k, v in data.items():
            if k in CJI_FIELD_KEYS and isinstance(v, str):
                out[k] = decrypt_value(v)
            else:
                out[k] = reveal_cji_fields(v, authorized)
        return out
    if isinstance(data, list):
        return [reveal_cji_fields(item, authorized) for item in data]
    return data
