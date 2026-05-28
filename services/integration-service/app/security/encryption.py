import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from app.settings import settings


def _derive_fernet_key(secret: str) -> bytes:
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


class CredentialEncryptionService:
    def __init__(self, secret: str | None = None) -> None:
        self._fernet = Fernet(_derive_fernet_key(secret or settings.credential_encryption_key))

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        try:
            return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
        except InvalidToken as exc:
            raise ValueError("Failed to decrypt credential") from exc


credential_encryption = CredentialEncryptionService()
