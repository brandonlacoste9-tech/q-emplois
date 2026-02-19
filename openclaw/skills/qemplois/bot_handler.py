"""
Q-Emplois Bot Handler — KimiClaw Edition
Fix 4: Migrated to KimiClaw with new skill registration

Main entry point for KimiClaw integration
Handles Telegram and WhatsApp messages
"""

import json
import os
import logging
from typing import Dict, Optional

from .booking_flow import BookingFlow, BookingState
from .auth_handler import get_auth_handler, AuthHandler
from .job_notifications import JobNotifier, JobRequest

logger = logging.getLogger(__name__)


class WhatsAppHandler:
    """WhatsApp-specific handler"""
    
    def __init__(self, booking_flow: BookingFlow, auth_handler: AuthHandler):
        self.booking_flow = booking_flow
        self.auth_handler = auth_handler
        self.notifier = JobNotifier()
    
    def handle_message(self, message_data: dict) -> dict:
        """Handle incoming WhatsApp message"""
        return self._handle_platform_message('whatsapp', message_data)
    
    def _handle_platform_message(self, platform: str, message_data: dict) -> dict:
        """Handle message from WhatsApp"""
        user_id = self._extract_user_id(message_data)
        message_text = self._extract_message_text(message_data)
        
        if not user_id or not message_text:
            return {'error': 'Invalid message format'}
        
        # Check for token in message (auth linking)
        if message_text.startswith('qem_'):
            return self._handle_auth_token(user_id, message_text)
        
        # Check if user is linked
        link = self.auth_handler.get_linked_user(platform, user_id)
        if not link:
            return self._get_auth_prompt(user_id)
        
        # Process booking flow
        response_text = self.booking_flow.handle_message(user_id, platform, message_text)
        
        return {
            'text': response_text,
            'to': user_id,
        }
    
    def _extract_user_id(self, message_data: dict) -> Optional[str]:
        """Extract WhatsApp user ID (phone number)"""
        try:
            return message_data.get('from') or message_data.get('profile', {}).get('wa_id')
        except:
            return None
    
    def _extract_message_text(self, message_data: dict) -> Optional[str]:
        """Extract message text from WhatsApp message"""
        try:
            # Handle different message types
            if 'text' in message_data:
                return message_data['text'].get('body', '')
            return message_data.get('body', '')
        except:
            return None
    
    def _handle_auth_token(self, user_id: str, token: str) -> dict:
        """Handle auth token submission"""
        success = self.auth_handler.verify_platform_token('whatsapp', user_id, token)
        
        if success:
            return {
                'text': (
                    "✅ Compte lié avec succès!\n\n"
                    "Vous pouvez maintenant réserver des services directement par WhatsApp.\n\n"
                    "Envoyez /start pour commencer une réservation."
                ),
                'to': user_id,
            }
        else:
            return {
                'text': (
                    "❌ Code invalide ou expiré.\n\n"
                    "Veuillez générer un nouveau code depuis votre compte Q-Emplois: "
                    "https://qemplois.ca/connexion"
                ),
                'to': user_id,
            }
    
    def _get_auth_prompt(self, user_id: str) -> dict:
        """Get authentication prompt for unlinked user"""
        return {
            'text': (
                "Bienvenue sur Q-Emplois! 🔧⚜️\n\n"
                "Pour réserver des services, liez votre compte:\n\n"
                "1. Connectez-vous sur https://qemplois.ca/connexion\n"
                "2. Allez dans Profil → Liens\n"
                "3. Sélectionnez WhatsApp\n"
                "4. Copiez le code et envoyez-le ici\n\n"
                "Ou envoyez /start pour créer un compte."
            ),
            'to': user_id,
        }


class TelegramHandler:
    """Telegram-specific handler"""
    
    def __init__(self, booking_flow: BookingFlow, auth_handler: AuthHandler):
        self.booking_flow = booking_flow
        self.auth_handler = auth_handler
        self.notifier = JobNotifier()
    
    def handle_message(self, message_data: dict) -> dict:
        """Handle incoming Telegram message"""
        return self._handle_platform_message('telegram', message_data)
    
    def _handle_platform_message(self, platform: str, message_data: dict) -> dict:
        """Handle message from Telegram"""
        user_id = self._extract_user_id(message_data)
        message_text = self._extract_message_text(message_data)
        
        if not user_id or not message_text:
            return {'error': 'Invalid message format'}
        
        # Handle /start with token
        if message_text.startswith('/start'):
            parts = message_text.split()
            if len(parts) > 1:
                # Token passed via deep link
                return self._handle_auth_token(user_id, parts[1])
        
        # Check if user is linked
        link = self.auth_handler.get_linked_user(platform, user_id)
        if not link:
            return self._get_auth_prompt(user_id)
        
        # Process booking flow
        response_text = self.booking_flow.handle_message(user_id, platform, message_text)
        
        return {
            'text': response_text,
            'chat_id': user_id,
            'parse_mode': 'HTML',
        }
    
    def _extract_user_id(self, message_data: dict) -> Optional[str]:
        """Extract Telegram user ID"""
        try:
            return str(message_data.get('from', {}).get('id') or 
                      message_data.get('chat', {}).get('id'))
        except:
            return None
    
    def _extract_message_text(self, message_data: dict) -> Optional[str]:
        """Extract message text from Telegram message"""
        try:
            return message_data.get('text', '')
        except:
            return None
    
    def _handle_auth_token(self, user_id: str, token: str) -> dict:
        """Handle auth token submission"""
        success = self.auth_handler.verify_platform_token('telegram', user_id, token)
        
        if success:
            return {
                'text': (
                    "✅ Compte lié avec succès!\n\n"
                    "Vous pouvez maintenant réserver des services directement sur Telegram.\n\n"
                    "Envoyez /start pour commencer une réservation."
                ),
                'chat_id': user_id,
                'parse_mode': 'HTML',
            }
        else:
            return {
                'text': (
                    "❌ Code invalide ou expiré.\n\n"
                    "Veuillez générer un nouveau code depuis votre compte Q-Emplois."
                ),
                'chat_id': user_id,
            }
    
    def _get_auth_prompt(self, user_id: str) -> dict:
        """Get authentication prompt for unlinked user"""
        return {
            'text': (
                "Bienvenue sur Q-Emplois! 🔧⚜️\n\n"
                "<b>Pour réserver des services, liez votre compte:</b>\n\n"
                "1. Connectez-vous sur <a href='https://qemplois.ca/connexion'>qemplois.ca</a>\n"
                "2. Allez dans Profil → Liens\n"
                "3. Sélectionnez Telegram\n"
                "4. Revenez ici et cliquez sur Démarrer\n\n"
                "Envoyez /start pour commencer."
            ),
            'chat_id': user_id,
            'parse_mode': 'HTML',
        }


class QEmploisBot:
    """Main bot handler for Q-Emplois — KimiClaw Edition"""
    
    def __init__(self):
        self.booking_flow = BookingFlow()
        self.auth_handler = get_auth_handler()
        self.whatsapp = WhatsAppHandler(self.booking_flow, self.auth_handler)
        self.telegram = TelegramHandler(self.booking_flow, self.auth_handler)
        self.job_notifier = JobNotifier()
    
    def handle_telegram_message(self, message_data: dict) -> dict:
        """Handle incoming Telegram message"""
        return self.telegram.handle_message(message_data)
    
    def handle_whatsapp_message(self, message_data: dict) -> dict:
        """Handle incoming WhatsApp message"""
        return self.whatsapp.handle_message(message_data)
    
    def notify_provider_new_job(self, provider_contact: dict, job_details: dict) -> dict:
        """Send new job notification to provider"""
        job = JobRequest(
            booking_id=job_details['booking_id'],
            service_type=job_details['service_type'],
            date=job_details['date'],
            time=job_details['time'],
            location=job_details['location'],
            distance_km=job_details['distance_km'],
            client_name=job_details.get('client_name', 'Client'),
            price_estimate=job_details['price_estimate'],
            notes=job_details.get('notes')
        )
        
        message = self.job_notifier.format_new_job_alert(job)
        
        return {
            'provider_id': provider_contact.get('id'),
            'message': message,
            'actions': ['accept', 'decline']
        }
    
    def confirm_booking_client(self, booking_data: dict) -> dict:
        """Send booking confirmation to client"""
        message = self.job_notifier.format_booking_confirmed_client(
            booking_id=booking_data['booking_id'],
            provider_name=booking_data['provider_name'],
            provider_phone=booking_data['provider_phone'],
            date=booking_data['date'],
            time=booking_data['time'],
            service=booking_data['service_type'],
            cancel_token=booking_data.get('cancel_token', 'xxx')
        )
        
        return {
            'user_id': booking_data['client_id'],
            'message': message
        }
    
    def handle_webhook(self, platform: str, webhook_data: dict) -> dict:
        """Handle webhook from Q-Emplois platform"""
        event_type = webhook_data.get('event')
        
        if event_type == 'booking.created':
            return self.notify_provider_new_job(
                webhook_data.get('provider', {}),
                webhook_data.get('job', {})
            )
        
        elif event_type == 'booking.confirmed':
            return self.confirm_booking_client(webhook_data.get('booking', {}))
        
        elif event_type == 'booking.cancelled':
            return {
                'user_id': webhook_data.get('client_id'),
                'message': f"❌ Votre réservation #{webhook_data.get('booking_id')} a été annulée."
            }
        
        elif event_type == 'auth.linked':
            # Auth linking completed
            payload = webhook_data.get('payload', {})
            logger.info(f"Auth linked: {payload.get('platform')}:{payload.get('platform_user_id')}")
            return {'status': 'ok'}
        
        return {'status': 'ignored'}


# ─── Global bot instance ─────────────────────────────────────────────────────
_bot_instance: Optional[QEmploisBot] = None


def get_bot() -> QEmploisBot:
    """Get or create bot instance"""
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = QEmploisBot()
    return _bot_instance


# ─── KimiClaw Skill Interface ─────────────────────────────────────────────────
# FIX 4: Updated for KimiClaw with proper skill registration

def book_service(service_type: str, date: str, time: str, 
                 address: str, provider_id: str = None) -> dict:
    """
    Skill: Book a service
    
    Args:
        service_type: Type of service (plomberie, électricité, etc.)
        date: Date in YYYY-MM-DD format
        time: Time in HH:MM format
        address: Full address with city
        provider_id: Optional preferred provider ID
    """
    bot = get_bot()
    
    # First geocode the address
    geo = bot.booking_flow._geocode(address)
    if not geo.get('found'):
        return {'error': 'Address not found', 'success': False}
    
    # Search for providers
    from datetime import datetime
    dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    
    # Create a mock session to search providers
    class MockSession:
        service_type = service_type
        date = dt
        location = geo
    
    providers = bot.booking_flow._fetch_providers_api(MockSession())
    
    if not providers:
        return {
            'success': False,
            'error': 'No providers available for this date/location',
            'providers_found': 0
        }
    
    # Return provider options
    return {
        'success': True,
        'providers_found': len(providers),
        'providers': [
            {
                'id': p['id'],
                'name': p['name'],
                'rating': p.get('rating', 0),
                'price_per_hour': p['price_per_hour'],
                'distance_km': p.get('distance_km', 0),
            }
            for p in providers[:3]
        ],
        'next_step': 'Select a provider and confirm booking',
    }


def find_providers(service_type: str, address: str, date: str = None) -> dict:
    """
    Skill: Find available service providers
    
    Args:
        service_type: Type of service
        address: Address to search near
        date: Optional date filter
    """
    bot = get_bot()
    
    # Geocode address
    geo = bot.booking_flow._geocode(address)
    
    return {
        'success': True,
        'location': {
            'lat': geo['lat'],
            'lng': geo['lng'],
            'display': geo.get('display', address),
        },
        'service_type': service_type,
        'message': f"Found location: {geo.get('display', address)}",
    }


def geocode_address(address: str) -> dict:
    """
    Skill: Geocode an address to coordinates
    
    FIX 4: New registered skill for KimiClaw
    
    Args:
        address: Full address to geocode
    """
    bot = get_bot()
    result = bot.booking_flow._geocode(address)
    
    return {
        'success': result.get('found', False),
        'address': address,
        'lat': result['lat'],
        'lng': result['lng'],
        'display_name': result.get('display', address),
    }


def link_account(platform: str, user_id: str, phone: str = None) -> dict:
    """
    Skill: Create account linking session
    
    Args:
        platform: 'whatsapp', 'telegram', or 'signal'
        user_id: Platform user ID
        phone: Optional phone number
    """
    auth = get_auth_handler()
    session = auth.create_session(
        user_id=user_id,
        platform=platform,
        phone=phone,
    )
    
    return {
        'success': True,
        'token': session['token'],
        'auth_url': session['auth_url'],
        'expires_in': session['expires_in'],
        'instructions': f"Send this token via {platform} to link your account",
    }


def verify_link(platform: str, platform_user_id: str) -> dict:
    """
    Skill: Verify if account is linked
    
    Args:
        platform: Platform name
        platform_user_id: Platform user ID
    """
    auth = get_auth_handler()
    link = auth.get_linked_user(platform, platform_user_id)
    
    if link:
        return {
            'linked': True,
            'user_id': link.get('user_id'),
            'linked_at': link.get('linked_at'),
        }
    
    return {
        'linked': False,
        'message': 'Account not linked. Use link_account to start linking.',
    }


def check_booking_status(booking_id: str) -> dict:
    """Skill: Check booking status"""
    return {
        'booking_id': booking_id,
        'status': 'pending',
        'message': 'Booking status check not yet implemented',
    }


# Legacy aliases for backward compatibility
def booking_request_skill(*args, **kwargs):
    """Legacy alias for book_service"""
    return book_service(*args, **kwargs)


def search_services_skill(*args, **kwargs):
    """Legacy alias for find_providers"""
    return find_providers(*args, **kwargs)


def authenticate_user_skill(platform: str, user_id: str) -> dict:
    """Legacy alias for link_account"""
    return link_account(platform, user_id)
