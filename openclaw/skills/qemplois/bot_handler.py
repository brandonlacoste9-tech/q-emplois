"""
Q-Emplois Bot Handler
Main entry point for OpenClaw integration
Handles Telegram and WhatsApp messages
"""

import json
import os
from typing import Dict, Optional

from .booking_flow import BookingFlow, BookingState
from .auth_handler import AuthHandler
from .job_notifications import JobNotifier, JobRequest

class QEmploisBot:
    """Main bot handler for Q-Emplois"""
    
    def __init__(self):
        self.booking_flow = BookingFlow()
        self.auth_handler = AuthHandler()
        self.job_notifier = JobNotifier()
    
    def handle_telegram_message(self, message_data: dict) -> dict:
        """Handle incoming Telegram message"""
        return self._handle_platform_message('telegram', message_data)
    
    def handle_whatsapp_message(self, message_data: dict) -> dict:
        """Handle incoming WhatsApp message"""
        return self._handle_platform_message('whatsapp', message_data)
    
    def _handle_platform_message(self, platform: str, message_data: dict) -> dict:
        """Handle message from any platform"""
        # Extract user ID and message text
        user_id = self._extract_user_id(platform, message_data)
        message_text = self._extract_message_text(platform, message_data)
        
        if not user_id or not message_text:
            return {'error': 'Invalid message format'}
        
        # Check if user is authenticated
        if not self.auth_handler.is_authenticated(platform, user_id):
            if message_text.lower() == '/start':
                auth_url = self.auth_handler.generate_auth_link(platform, user_id)
                return {
                    'text': f"""Bienvenue sur Q-Emplois! 🔧

Pour réserver des services, vous devez créer un compte.

🔗 Créer un compte: {auth_url}

(Le lien est valide 15 minutes)""",
                    'parse_mode': 'HTML'
                }
            else:
                return {
                    'text': "Veuillez d'abord vous connecter avec /start"
                }
        
        # Process booking flow
        response_text = self.booking_flow.handle_message(user_id, platform, message_text)
        
        return {
            'text': response_text,
            'parse_mode': 'HTML'
        }
    
    def _extract_user_id(self, platform: str, message_data: dict) -> Optional[str]:
        """Extract user ID from message data"""
        try:
            if platform == 'telegram':
                return str(message_data.get('from', {}).get('id'))
            elif platform == 'whatsapp':
                return message_data.get('from')
        except:
            pass
        return None
    
    def _extract_message_text(self, platform: str, message_data: dict) -> Optional[str]:
        """Extract message text from message data"""
        try:
            if platform == 'telegram':
                return message_data.get('text', '')
            elif platform == 'whatsapp':
                return message_data.get('body', '')
        except:
            pass
        return None
    
    def notify_provider_new_job(self, provider_contact: dict, job_details: dict) -> dict:
        """Send new job notification to provider"""
        job = JobRequest(
            booking_id=job_details['booking_id'],
            service_type=job_details['service_type'],
            date=job_details['date'],
            time=job_details['time'],
            location=job_details['location'],
            distance_km=job_details['distance_km'],
            client_name=job_details.get('client_name', 'Client'),  # Masked
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
            # New booking created - notify provider
            return self.notify_provider_new_job(
                webhook_data.get('provider', {}),
                webhook_data.get('job', {})
            )
        
        elif event_type == 'booking.confirmed':
            # Booking confirmed - notify client
            return self.confirm_booking_client(webhook_data.get('booking', {}))
        
        elif event_type == 'booking.cancelled':
            # Booking cancelled
            return {
                'user_id': webhook_data.get('client_id'),
                'message': f"❌ Votre réservation #{webhook_data.get('booking_id')} a été annulée."
            }
        
        return {'status': 'ignored'}

# Global bot instance
_bot_instance: Optional[QEmploisBot] = None

def get_bot() -> QEmploisBot:
    """Get or create bot instance"""
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = QEmploisBot()
    return _bot_instance

# OpenClaw skill interface
def booking_request_skill(service_type: str, date: str, time: str, 
                          location: dict, provider_id: str = None) -> dict:
    """Skill: Create booking request"""
    return {
        'booking_id': f"QEP-{date.replace('-', '')}-001",
        'provider': {'name': 'Provider Name', 'id': provider_id},
        'price_estimate': 90.0,
        'status': 'pending_payment'
    }

def search_services_skill(service_type: str, date: str, lat: float, 
                          lng: float, radius_km: int = 10) -> dict:
    """Skill: Search for service providers"""
    return {
        'providers': [
            {
                'id': 'prov_001',
                'name': 'Jean Tremblay',
                'rating': 4.8,
                'reviews': 127,
                'price_per_hour': 45,
                'distance_km': 2.1
            }
        ]
    }

def payment_processing_skill(booking_id: str, amount: float) -> dict:
    """Skill: Process payment"""
    return {
        'payment_url': f"https://pay.qemplois.ca/sess_{booking_id.lower().replace('-', '')}",
        'status': 'pending'
    }

def authenticate_user_skill(platform: str, user_id: str) -> dict:
    """Skill: Authenticate user"""
    bot = get_bot()
    auth_url = bot.auth_handler.generate_auth_link(platform, user_id)
    is_linked = bot.auth_handler.is_authenticated(platform, user_id)
    
    return {
        'auth_url': auth_url,
        'linked': is_linked
    }
