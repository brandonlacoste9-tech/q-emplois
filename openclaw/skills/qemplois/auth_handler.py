"""Authentication handler for Q-Emplois bot
Links Telegram/WhatsApp accounts to Q-Emplois user accounts"""

import json
import time
from typing import Optional, Dict
from datetime import datetime, timedelta

class AuthHandler:
    """Handles user authentication and account linking"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or "auth_sessions.json"
        self.sessions: Dict[str, dict] = {}
        self._load_sessions()
    
    def _load_sessions(self):
        """Load active sessions from storage"""
        try:
            with open(self.db_path, 'r') as f:
                self.sessions = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.sessions = {}
    
    def _save_sessions(self):
        """Save sessions to storage"""
        with open(self.db_path, 'w') as f:
            json.dump(self.sessions, f)
    
    def generate_auth_link(self, platform: str, user_id: str) -> str:
        """Generate a time-limited auth link"""
        token = f"{platform}_{user_id}_{int(time.time())}"
        expiry = datetime.now() + timedelta(minutes=15)
        
        self.sessions[token] = {
            'platform': platform,
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            'expires_at': expiry.isoformat(),
            'linked': False
        }
        self._save_sessions()
        
        # Return URL to auth page
        return f"https://qemplois.ca/auth?token={token}&platform={platform}"
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify if auth token is valid and not expired"""
        session = self.sessions.get(token)
        if not session:
            return None
        
        expires = datetime.fromisoformat(session['expires_at'])
        if datetime.now() > expires:
            return None
        
        return session
    
    def link_account(self, token: str, qemplois_user_id: str) -> bool:
        """Link Telegram/WhatsApp account to Q-Emplois account"""
        session = self.verify_token(token)
        if not session:
            return False
        
        self.sessions[token]['linked'] = True
        self.sessions[token]['qemplois_user_id'] = qemplois_user_id
        self._save_sessions()
        return True
    
    def is_authenticated(self, platform: str, user_id: str) -> bool:
        """Check if user has linked their account"""
        for token, session in self.sessions.items():
            if (session.get('platform') == platform and 
                session.get('user_id') == user_id and 
                session.get('linked')):
                return True
        return False
    
    def get_linked_user_id(self, platform: str, user_id: str) -> Optional[str]:
        """Get Q-Emplois user ID for linked account"""
        for token, session in self.sessions.items():
            if (session.get('platform') == platform and 
                session.get('user_id') == user_id and 
                session.get('linked')):
                return session.get('qemplois_user_id')
        return None
    
    def unlink_account(self, platform: str, user_id: str) -> bool:
        """Unlink account (for data deletion requests)"""
        for token, session in list(self.sessions.items()):
            if (session.get('platform') == platform and 
                session.get('user_id') == user_id):
                del self.sessions[token]
                self._save_sessions()
                return True
        return False
    
    def cleanup_expired(self):
        """Remove expired sessions (Law 25 compliance)"""
        now = datetime.now()
        expired = []
        for token, session in self.sessions.items():
            expires = datetime.fromisoformat(session['expires_at'])
            if now > expires:
                expired.append(token)
        
        for token in expired:
            del self.sessions[token]
        
        if expired:
            self._save_sessions()
