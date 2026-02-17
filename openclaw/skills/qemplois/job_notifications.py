"""Job notifications for Q-Emplois providers"""

from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class JobRequest:
    """Represents a job request to send to providers"""
    booking_id: str
    service_type: str
    date: str
    time: str
    location: str
    distance_km: float
    client_name: str  # Masked for privacy
    price_estimate: float
    notes: Optional[str] = None

class JobNotifier:
    """Handles notifications to service providers"""
    
    SERVICE_EMOJIS = {
        'plomberie': '🔧',
        'plumber': '🔧',
        'électricité': '⚡',
        'electricity': '⚡',
        'électricien': '⚡',
        'nettoyage': '🧹',
        'cleaning': '🧹',
        'jardinage': '🌱',
        'gardening': '🌱',
        'déménagement': '🚚',
        'moving': '🚚',
        'peinture': '🎨',
        'painting': '🎨'
    }
    
    def __init__(self):
        pass
    
    def _get_emoji(self, service_type: str) -> str:
        """Get emoji for service type"""
        service_lower = service_type.lower()
        return self.SERVICE_EMOJIS.get(service_lower, '🔧')
    
    def format_new_job_alert(self, job: JobRequest) -> str:
        """Format new job notification for provider"""
        emoji = self._get_emoji(job.service_type)
        
        message = f"""🔔 NOUVELLE DEMANDE!

{emoji} Service: {job.service_type.title()}
📅 Date: {job.date}
🕐 Heure: {job.time}
📍 Lieu: {job.location} ({job.distance_km:.1f} km)
👤 Client: {job.client_name}
💰 Prix estimé: {job.price_estimate:.0f} $
"""
        if job.notes:
            message += f"\n📝 Notes: {job.notes}\n"
        
        message += "\nAccepter? 👍 / Refuser? 👎"
        return message
    
    def format_job_accepted(self, job: JobRequest, provider_name: str) -> str:
        """Format confirmation when provider accepts job"""
        return f"""✅ Demande acceptée!

{provider_name} a accepté votre demande de {job.service_type}.

Nous vous contacterons sous peu pour confirmer les détails.
"""
    
    def format_job_declined(self, job: JobRequest) -> str:
        """Format message when provider declines"""
        return f"""❌ Indisponible

Le professionnel n'est pas disponible pour cette date.

Nous recherchons d'autres professionnels près de chez vous...
"""
    
    def format_booking_confirmed_client(self, booking_id: str, provider_name: str,
                                        provider_phone: str, date: str, 
                                        time: str, service: str,
                                        cancel_token: str) -> str:
        """Format booking confirmation for client"""
        emoji = self._get_emoji(service)
        
        return f"""✅ Votre réservation est confirmée!

{emoji} Service: {service.title()}
👤 {provider_name}
📞 {provider_phone}
📅 {date} à {time}

Numéro de suivi: #{booking_id}
Annuler: https://qemplois.ca/cancel/{cancel_token}
"""
    
    def format_provider_reminder(self, job: JobRequest, client_phone: str) -> str:
        """Format reminder for provider before job"""
        emoji = self._get_emoji(job.service_type)
        
        return f"""⏰ RAPPEL - RDV dans 1h

{emoji} {job.service_type.title()}
📍 {job.location}
🕐 {job.time}
👤 Client: {job.client_name}
📞 {client_phone}

Bon travail! 💪
"""
    
    def format_provider_confirmation(self, job: JobRequest, client_phone: str) -> str:
        """Format confirmation message sent to provider"""
        emoji = self._get_emoji(job.service_type)
        
        return f"""✅ RDV CONFIRMÉ

{emoji} {job.service_type.title()}
📍 {job.location}
🕐 {job.date} à {job.time}
👤 Client: {job.client_name}
📞 {client_phone}
💰 {job.price_estimate:.0f} $

Merci d'arriver à l'heure!
"""
    
    def format_client_review_request(self, booking_id: str, provider_name: str) -> str:
        """Format review request sent after job completion"""
        return f"""⭐ Comment s'est passé votre service?

Votre avis nous intéresse! Laissez une évaluation pour {provider_name}:

https://qemplois.ca/review/{booking_id}

Merci d'avoir utilisé Q-Emplois! 🙏
"""
