from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repository import credential_repository, oauth2_repository
from app.security.encryption import credential_encryption


async def load_connector_credentials(session: AsyncSession, connector_id: str) -> dict[str, str]:
    """Merge encrypted credentials with the latest OAuth2 access token."""
    creds = await credential_repository.get_decrypted(session, connector_id)
    token = await oauth2_repository.get_latest(session, connector_id)
    if token:
        if datetime.now(timezone.utc) >= token.expires_at:
            creds["oauth_expired"] = "true"
        else:
            access = credential_encryption.decrypt(token.access_token_encrypted)
            creds["oauth_token"] = access
            creds["access_token"] = access
            if token.refresh_token_encrypted:
                creds["refresh_token"] = credential_encryption.decrypt(token.refresh_token_encrypted)
    return creds
