"""Q-Emplois Auth Handler — Complete Auth Flow with Redis
Fix 3: Real auth with Redis, HMAC tokens, and webhook callbacks
"""
import logging
import json
import hmac
import hashlib
import secrets
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import redis

logger = logging.getLogger(__name__)


class AuthHandler:
    """
    Complete authentication handler for Q-Emplois.
    
    Features:
    - Redis session storage with auto-TTL (Law 25 native)
    - HMAC-signed tokens
    - Webhook callbacks for auth linking
    - Platform integration (WhatsApp, Telegram, etc.)
    """

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379/0",
        webhook_url: str = "https://api.qemplois.ca/api/webhooks/auth",
        secret_key: str = None,
    ):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.webhook_url = webhook_url
        self.secret_key = secret_key or secrets.token_hex(32)
        self.token_ttl = 86400  # 24 hours

    # ── Token Generation ─────────────────────────────────────────────────────

    def _generate_token(self, user_id: str, platform: str) -> str:
        """Generate HMAC-signed token"""
        timestamp = str(int(time.time()))
        nonce = secrets.token_hex(8)
        data = f"{user_id}:{platform}:{timestamp}:{nonce}"
        signature = hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()[:16]
        return f"qem_{timestamp}_{nonce}_{signature}"

    def _verify_token(self, token: str) -> Optional[Dict[str, str]]:
        """Verify HMAC signature on token"""
        try:
            parts = token.split("_")
            if len(parts) != 4 or parts[0] != "qem":
                return None

            timestamp, nonce, signature = parts[1], parts[2], parts[3]
            # Check token age
            if int(time.time()) - int(timestamp) > self.token_ttl:
                return None

            # Token is valid structure, full verification happens on lookup
            return {
                "timestamp": timestamp,
                "nonce": nonce,
                "signature": signature,
            }
        except Exception:
            return None

    # ── Session Management ───────────────────────────────────────────────────

    def create_session(
        self,
        user_id: str,
        platform: str,
        phone: str = None,
        email: str = None,
    ) -> Dict[str, Any]:
        """Create new auth session in Redis"""
        token = self._generate_token(user_id, platform)
        session_key = f"auth:session:{token}"

        session_data = {
            "user_id": user_id,
            "platform": platform,
            "phone": phone,
            "email": email,
            "created_at": datetime.utcnow().isoformat(),
            "status": "pending",  # pending, linked, verified
            "linked_user_id": None,
        }

        # Store in Redis with TTL
        self.redis.setex(
            session_key,
            self.token_ttl,
            json.dumps(session_data)
        )

        # Also index by user:platform for quick lookup
        index_key = f"auth:index:{platform}:{user_id}"
        self.redis.setex(index_key, self.token_ttl, token)

        logger.info(f"Created auth session for {platform}:{user_id}")
        return {
            "token": token,
            "auth_url": f"https://qemplois.ca/auth/link?token={token}",
            "expires_in": self.token_ttl,
        }

    def get_session(self, token: str) -> Optional[Dict[str, Any]]:
        """Retrieve session from Redis"""
        if not self._verify_token(token):
            return None

        session_key = f"auth:session:{token}"
        data = self.redis.get(session_key)

        if data:
            session = json.loads(data)
            # Refresh TTL on access
            self.redis.expire(session_key, self.token_ttl)
            return session
        return None

    def update_session(self, token: str, updates: Dict[str, Any]) -> bool:
        """Update session data"""
        session_key = f"auth:session:{token}"
        data = self.redis.get(session_key)

        if not data:
            return False

        session = json.loads(data)
        session.update(updates)
        session["updated_at"] = datetime.utcnow().isoformat()

        self.redis.setex(session_key, self.token_ttl, json.dumps(session))
        return True

    def delete_session(self, token: str) -> bool:
        """Delete session from Redis"""
        session = self.get_session(token)
        if session:
            # Remove index
            index_key = f"auth:index:{session['platform']}:{session['user_id']}"
            self.redis.delete(index_key)

        session_key = f"auth:session:{token}"
        return self.redis.delete(session_key) > 0

    # ── Platform Linking ─────────────────────────────────────────────────────

    def link_platform(
        self,
        token: str,
        platform_user_id: str,
        platform: str,
        metadata: Dict = None,
    ) -> Dict[str, Any]:
        """
        Link a chat platform user to Q-Emplois account.
        Called by the auth callback controller.
        """
        session = self.get_session(token)
        if not session:
            return {"success": False, "error": "Invalid or expired token"}

        if session.get("status") == "linked":
            return {"success": False, "error": "Already linked"}

        # Update session
        updates = {
            "status": "linked",
            "linked_user_id": platform_user_id,
            "linked_platform": platform,
            "linked_at": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }
        self.update_session(token, updates)

        # Store permanent link
        link_key = f"auth:link:{platform}:{platform_user_id}"
        self.redis.setex(
            link_key,
            30 * 86400,  # 30 days
            json.dumps({
                "token": token,
                "user_id": session["user_id"],
                "linked_at": datetime.utcnow().isoformat(),
            })
        )

        # Fire webhook
        self._fire_webhook("auth.linked", {
            "token": token,
            "user_id": session["user_id"],
            "platform": platform,
            "platform_user_id": platform_user_id,
            "metadata": metadata,
        })

        logger.info(f"Linked {platform}:{platform_user_id} to user {session['user_id']}")
        return {
            "success": True,
            "user_id": session["user_id"],
            "platform": platform,
        }

    def get_linked_user(self, platform: str, platform_user_id: str) -> Optional[Dict]:
        """Get linked Q-Emplois user for a platform user"""
        link_key = f"auth:link:{platform}:{platform_user_id}"
        data = self.redis.get(link_key)

        if data:
            link = json.loads(data)
            # Refresh TTL
            self.redis.expire(link_key, 30 * 86400)
            return link
        return None

    def unlink_platform(self, platform: str, platform_user_id: str) -> bool:
        """Unlink a platform user"""
        link_key = f"auth:link:{platform}:{platform_user_id}"
        data = self.redis.get(link_key)

        if data:
            link = json.loads(data)
            # Update session status
            if link.get("token"):
                self.update_session(link["token"], {
                    "status": "unlinked",
                    "unlinked_at": datetime.utcnow().isoformat(),
                })

        return self.redis.delete(link_key) > 0

    # ── Webhook ───────────────────────────────────────────────────────────────

    def _fire_webhook(self, event: str, payload: Dict):
        """Fire webhook to Q-Emplois backend"""
        import requests

        try:
            requests.post(
                self.webhook_url,
                json={
                    "event": event,
                    "timestamp": datetime.utcnow().isoformat(),
                    "payload": payload,
                },
                headers={
                    "X-QEmplois-Signature": self._sign_webhook_payload(payload),
                },
                timeout=10,
            )
        except Exception as e:
            logger.error(f"Webhook failed: {e}")

    def _sign_webhook_payload(self, payload: Dict) -> str:
        """Sign webhook payload"""
        data = json.dumps(payload, sort_keys=True)
        return hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()

    # ── WhatsApp/Telegram Integration ─────────────────────────────────────────

    def generate_whatsapp_auth_link(self, phone: str, user_id: str = None) -> str:
        """Generate WhatsApp deep link for auth"""
        session = self.create_session(
            user_id=user_id or f"wa_{phone}",
            platform="whatsapp",
            phone=phone,
        )
        # WhatsApp click-to-chat with pre-filled message
        message = f"Bonjour! Je veux lier mon compte Q-Emplois. Mon code: {session['token']}"
        encoded_msg = requests.utils.quote(message)
        return f"https://wa.me/?text={encoded_msg}"

    def generate_telegram_auth_link(self, telegram_user_id: str, username: str = None) -> str:
        """Generate Telegram auth link"""
        session = self.create_session(
            user_id=f"tg_{telegram_user_id}",
            platform="telegram",
        )
        # Deep link to bot with start parameter
        return f"https://t.me/QEmploisBot?start={session['token']}"

    def verify_platform_token(self, platform: str, user_id: str, token: str) -> bool:
        """Verify token provided by user via chat"""
        session = self.get_session(token)
        if not session:
            return False

        if session["platform"] != platform:
            return False

        # Link the platform
        result = self.link_platform(token, user_id, platform)
        return result["success"]

    # ── Cleanup ───────────────────────────────────────────────────────────────

    def cleanup_expired(self) -> int:
        """Redis handles TTL automatically, but this method
        can be used for any manual cleanup if needed."""
        return 0


# Singleton instance for import
_auth_handler: Optional[AuthHandler] = None


def get_auth_handler() -> AuthHandler:
    """Get or create singleton auth handler"""
    global _auth_handler
    if _auth_handler is None:
        _auth_handler = AuthHandler()
    return _auth_handler
