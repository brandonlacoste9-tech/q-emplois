"""Main booking flow for Q-Emplois chatbot
State machine for booking services via Telegram/WhatsApp"""

from enum import Enum
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime

from .utils import (
    parse_date, parse_time, format_price, format_distance,
    format_datetime_fr, generate_booking_id, validate_address
)
from .job_notifications import JobRequest

class BookingState(Enum):
    """Booking conversation states"""
    IDLE = "idle"
    ASK_SERVICE = "ask_service"
    ASK_DATE = "ask_date"
    ASK_TIME = "ask_time"
    ASK_LOCATION = "ask_location"
    SEARCHING_PROVIDERS = "searching_providers"
    SHOW_PROVIDERS = "show_providers"
    CONFIRM_BOOKING = "confirm_booking"
    PAYMENT = "payment"
    COMPLETED = "completed"

@dataclass
class BookingData:
    """Stores booking data during conversation"""
    user_id: str
    platform: str  # 'telegram' or 'whatsapp'
    state: BookingState = BookingState.IDLE
    service_type: Optional[str] = None
    date: Optional[datetime] = None
    time: Optional[tuple] = None  # (hour, minute)
    location: Optional[Dict] = None  # {address, lat, lng}
    selected_provider: Optional[Dict] = None
    providers: List[Dict] = field(default_factory=list)
    booking_id: Optional[str] = None
    price_estimate: Optional[float] = None
    
    def to_dict(self) -> dict:
        """Convert to dict (for storage)"""
        return {
            'user_id': self.user_id,
            'platform': self.platform,
            'state': self.state.value,
            'service_type': self.service_type,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time,
            'location': self.location,
            'selected_provider': self.selected_provider,
            'providers': self.providers,
            'booking_id': self.booking_id,
            'price_estimate': self.price_estimate
        }

class BookingFlow:
    """Main booking conversation flow handler"""
    
    # Service options with emojis
    SERVICES = {
        '1': ('plomberie', '🔧 Plomberie'),
        '2': ('électricité', '⚡ Électricité'),
        '3': ('nettoyage', '🧹 Nettoyage'),
        '4': ('jardinage', '🌱 Jardinage'),
        '5': ('déménagement', '🚚 Déménagement'),
    }
    
    def __init__(self):
        self.sessions: Dict[str, BookingData] = {}
    
    def get_or_create_session(self, user_id: str, platform: str) -> BookingData:
        """Get existing session or create new one"""
        key = f"{platform}:{user_id}"
        if key not in self.sessions:
            self.sessions[key] = BookingData(
                user_id=user_id,
                platform=platform,
                state=BookingState.IDLE
            )
        return self.sessions[key]
    
    def get_welcome_message(self) -> str:
        """Get welcome message with service options"""
        services_text = "\n".join([f"{k}. {v[1]}" for k, v in self.SERVICES.items()])
        return f"""Bonjour! 👋 Je suis Q-Emplois, votre assistant pour trouver des professionnels au Québec.

Quel service cherchez-vous aujourd'hui?

{services_text}

(Entrez le numéro ou nom du service)"""
    
    def get_help_message(self) -> str:
        """Get help message with available commands"""
        return """🆘 AIDE Q-EMPLOIS

Commandes disponibles:
• /start - Commencer une réservation
• /aide - Afficher cette aide
• /mesreservations - Voir mes réservations
• /annuler [numéro] - Annuler une réservation
• /profil - Mon profil
• /devenirpro - Devenir prestataire

Pour réserver, suivez simplement les instructions! 🎯
"""
    
    def handle_message(self, user_id: str, platform: str, message: str) -> str:
        """Main message handler - processes user input and returns response"""
        session = self.get_or_create_session(user_id, platform)
        message = message.strip().lower()
        
        # Handle commands
        if message.startswith('/'):
            return self._handle_command(session, message)
        
        # State machine
        if session.state == BookingState.IDLE:
            return self._handle_idle(session, message)
        elif session.state == BookingState.ASK_SERVICE:
            return self._handle_service_selection(session, message)
        elif session.state == BookingState.ASK_DATE:
            return self._handle_date(session, message)
        elif session.state == BookingState.ASK_TIME:
            return self._handle_time(session, message)
        elif session.state == BookingState.ASK_LOCATION:
            return self._handle_location(session, message)
        elif session.state == BookingState.SHOW_PROVIDERS:
            return self._handle_provider_selection(session, message)
        elif session.state == BookingState.CONFIRM_BOOKING:
            return self._handle_confirmation(session, message)
        
        return self.get_welcome_message()
    
    def _handle_command(self, session: BookingData, message: str) -> str:
        """Handle bot commands"""
        if message == '/start':
            session.state = BookingState.ASK_SERVICE
            return self.get_welcome_message()
        
        if message == '/aide':
            return self.get_help_message()
        
        if message == '/mesreservations':
            return "📋 Fonctionnalité à venir - Vos réservations seront affichées ici."
        
        if message.startswith('/annuler'):
            return "❌ Pour annuler une réservation, visitez: https://qemplois.ca/cancel"
        
        if message == '/profil':
            return "👤 Fonctionnalité à venir - Gérez votre profil sur https://qemplois.ca/profil"
        
        if message == '/devenirpro':
            return """🌟 Devenez prestataire Q-Emplois!

Rejoignez notre réseau de professionnels:
https://qemplois.ca/devenir-pro

Avantages:
• Trouvez des clients facilement
• Gérez votre agenda
• Paiements sécurisés
"""
        
        return "Commande non reconnue. Tapez /aide pour la liste des commandes."
    
    def _handle_idle(self, session: BookingData, message: str) -> str:
        """Handle conversation start"""
        greetings = ['bonjour', 'salut', 'hey', 'hello', 'hi', 'coucou']
        if any(g in message for g in greetings):
            session.state = BookingState.ASK_SERVICE
            return self.get_welcome_message()
        
        # If they directly mention a service
        for key, (service_id, service_name) in self.SERVICES.items():
            if service_id in message or service_name.lower() in message:
                session.state = BookingState.ASK_SERVICE
                return self._handle_service_selection(session, key)
        
        return self.get_welcome_message()
    
    def _handle_service_selection(self, session: BookingData, message: str) -> str:
        """Handle service type selection"""
        # Check if they entered a number
        if message in self.SERVICES:
            service_key = message
        else:
            # Try to match by name
            service_key = None
            for key, (service_id, service_name) in self.SERVICES.items():
                if service_id in message or service_name.lower().replace('🔧 ', '').replace('⚡ ', '').replace('🧹 ', '').replace('🌱 ', '').replace('🚚 ', '') in message:
                    service_key = key
                    break
        
        if service_key:
            session.service_type = self.SERVICES[service_key][0]
            session.state = BookingState.ASK_DATE
            
            service_display = self.SERVICES[service_key][1]
            return f"Parfait! Vous avez choisi {service_display}.\n\nPour quelle date avez-vous besoin d'un professionnel?\n(Ex: aujourd'hui, demain, 20 février)"
        
        return "Je n'ai pas compris. Veuillez choisir un numéro de 1 à 5 ou le nom du service."
    
    def _handle_date(self, session: BookingData, message: str) -> str:
        """Handle date input"""
        parsed_date = parse_date(message)
        
        if parsed_date:
            session.date = parsed_date
            session.state = BookingState.ASK_TIME
            
            date_display = format_datetime_fr(parsed_date)
            return f"Entendu pour {date_display}.\n\nÀ quelle heure? (Ex: 14h, 9h30)"
        
        return "Je n'ai pas compris la date. Essayez: aujourd'hui, demain, ou une date comme '20 février'."
    
    def _handle_time(self, session: BookingData, message: str) -> str:
        """Handle time input"""
        parsed_time = parse_time(message)
        
        if parsed_time:
            session.time = parsed_time
            session.state = BookingState.ASK_LOCATION
            
            hour, minute = parsed_time
            time_display = f"{hour}h{minute:02d}" if minute > 0 else f"{hour}h"
            return f"Parfait pour {time_display}.\n\nOù se situe le travail? (adresse complète avec code postal si possible)"
        
        return "Je n'ai pas compris l'heure. Essayez: 14h, 9h30, 14:30"
    
    def _handle_location(self, session: BookingData, message: str) -> str:
        """Handle location input"""
        if not validate_address(message):
            return "L'adresse semble incomplète. Veuillez entrer une adresse complète (numéro civique, rue, ville)."
        
        # TODO: Geocode address to get lat/lng
        session.location = {
            'address': message,
            'lat': 45.5019,  # Placeholder - Montreal
            'lng': -73.5674
        }
        
        session.state = BookingState.SEARCHING_PROVIDERS
        
        # Return searching message and trigger search
        return self._search_providers(session)
    
    def _search_providers(self, session: BookingData) -> str:
        """Search for available providers"""
        # TODO: Call actual Q-Emplois API
        # For now, return mock providers
        
        mock_providers = [
            {
                'id': 'prov_001',
                'name': 'Jean Tremblay',
                'rating': 4.8,
                'reviews': 127,
                'price_per_hour': 45,
                'distance_km': 2.1,
                'phone': '+1 514-555-0123'
            },
            {
                'id': 'prov_002',
                'name': 'Marie Gagnon',
                'rating': 4.9,
                'reviews': 89,
                'price_per_hour': 50,
                'distance_km': 3.2,
                'phone': '+1 514-555-0456'
            },
            {
                'id': 'prov_003',
                'name': 'Robert Lavoie',
                'rating': 4.6,
                'reviews': 203,
                'price_per_hour': 40,
                'distance_km': 4.8,
                'phone': '+1 514-555-0789'
            }
        ]
        
        session.providers = mock_providers
        session.state = BookingState.SHOW_PROVIDERS
        
        return self._format_providers_list(session, mock_providers)
    
    def _format_providers_list(self, session: BookingData, providers: List[Dict]) -> str:
        """Format providers list for display"""
        if not providers:
            return """😔 Aucun professionnel disponible pour cette date/heure.

Essayez:
• Une autre date
• Un autre créneau horaire
• Un rayon de recherche plus grand

Voulez-vous chercher à nouveau? (oui/non)"""
        
        hour, minute = session.time
        time_display = f"{hour}h{minute:02d}" if minute > 0 else f"{hour}h"
        date_display = format_datetime_fr(session.date)
        
        message = f"🔍 J'ai trouvé {len(providers)} professionnels:\n\n"
        
        for i, provider in enumerate(providers, 1):
            distance = format_distance(provider['distance_km'])
            message += f"{i}. {provider['name']} ⭐ {provider['rating']} ({provider['reviews']} avis)\n"
            message += f"   {format_price(provider['price_per_hour'])}/heure - {distance}\n\n"
        
        message += "Quel professionnel préférez-vous? (1, 2 ou 3)\n"
        message += "Ou tapez 'autre' pour chercher une autre date."
        
        return message
    
    def _handle_provider_selection(self, session: BookingData, message: str) -> str:
        """Handle provider selection"""
        if message in ['autre', 'autres', 'changer', 'autre date']:
            session.state = BookingState.ASK_DATE
            return "D'accord. Pour quelle nouvelle date cherchez-vous?"
        
        try:
            choice = int(message)
            if 1 <= choice <= len(session.providers):
                session.selected_provider = session.providers[choice - 1]
                session.state = BookingState.CONFIRM_BOOKING
                
                # Calculate price estimate (2 hours default)
                session.price_estimate = session.selected_provider['price_per_hour'] * 2
                
                return self._format_booking_summary(session)
        except ValueError:
            pass
        
        return "Veuillez entrer un numéro valide (1, 2 ou 3) ou tapez 'autre' pour changer la date."
    
    def _format_booking_summary(self, session: BookingData) -> str:
        """Format booking summary for confirmation"""
        provider = session.selected_provider
        hour, minute = session.time
        time_display = f"{hour}h{minute:02d}" if minute > 0 else f"{hour}h"
        date_display = format_datetime_fr(session.date)
        
        # Map service to display name
        service_display = session.service_type.title()
        for key, (service_id, service_name) in self.SERVICES.items():
            if service_id == session.service_type:
                service_display = service_name
                break
        
        return f"""📋 Récapitulatif:

Service: {service_display}
Date: {date_display} à {time_display}
Lieu: {session.location['address']}

Professionnel: {provider['name']}
⭐ {provider['rating']} ({provider['reviews']} avis)
💰 Prix estimé: {format_price(session.price_estimate)} (2 heures)

Confirmer la réservation? (oui/non)"""
    
    def _handle_confirmation(self, session: BookingData, message: str) -> str:
        """Handle booking confirmation"""
        if message in ['oui', 'yes', 'ok', 'daccord', "d'accord", 'confirmer']:
            # Generate booking ID
            session.booking_id = generate_booking_id()
            session.state = BookingState.COMPLETED
            
            provider = session.selected_provider
            hour, minute = session.time
            time_display = f"{hour}h{minute:02d}" if minute > 0 else f"{hour}h"
            date_display = format_datetime_fr(session.date)
            
            # Generate payment URL
            payment_url = f"https://pay.qemplois.ca/sess_{session.booking_id.lower().replace('-', '')}"
            
            return f"""🎉 Réservation confirmée!

Numéro: #{session.booking_id}

💳 Paiement sécurisé:
{payment_url}

Vous recevrez un SMS de confirmation.
{provider['name'].split()[0]} arrivera {date_display.lower().replace(' ', ' ')} entre {hour}h{max(0, minute-15):02d} et {hour}h{min(59, minute+15):02d}.

Merci d'utiliser Q-Emplois! 🙏"""
        
        elif message in ['non', 'no', 'annuler', 'cancel']:
            session.state = BookingState.SHOW_PROVIDERS
            return "D'accord. Souhaitez-vous choisir un autre professionnel? (1, 2 ou 3)"
        
        return "Veuillez répondre 'oui' pour confirmer ou 'non' pour annuler."
    
    def reset_session(self, user_id: str, platform: str):
        """Reset user session"""
        key = f"{platform}:{user_id}"
        if key in self.sessions:
            del self.sessions[key]
