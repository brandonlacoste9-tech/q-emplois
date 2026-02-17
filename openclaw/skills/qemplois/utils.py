"""Utility functions for Q-Emplois bot"""

import re
from datetime import datetime, timedelta
from typing import Optional, Tuple

def parse_date(text: str, reference_date: datetime = None) -> Optional[datetime]:
    """
    Parse French date expressions into datetime objects.
    Handles: aujourd'hui, demain, after-demain, specific dates
    """
    if reference_date is None:
        reference_date = datetime.now()
    
    text = text.lower().strip()
    
    # Relative dates
    if text in ["aujourd'hui", "aujourd hui", "aujourdhui", "today"]:
        return reference_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if text in ["demain", "tomorrow"]:
        return (reference_date + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    if text in ["après-demain", "apres-demain", "après demain", "apres demain"]:
        return (reference_date + timedelta(days=2)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # French month names
    months_fr = {
        'janvier': 1, 'février': 2, 'fevrier': 2, 'mars': 3, 'avril': 4,
        'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8, 'aout': 8,
        'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12, 'decembre': 12
    }
    
    # Try to parse "20 février" format
    day_month_pattern = r'(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)'
    match = re.search(day_month_pattern, text)
    if match:
        day = int(match.group(1))
        month = months_fr.get(match.group(2), 1)
        year = reference_date.year
        # If month has passed, assume next year
        if month < reference_date.month:
            year += 1
        try:
            return datetime(year, month, day)
        except ValueError:
            return None
    
    # Try to parse DD/MM/YYYY or DD-MM-YYYY
    numeric_pattern = r'(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?'
    match = re.search(numeric_pattern, text)
    if match:
        day = int(match.group(1))
        month = int(match.group(2))
        year_str = match.group(3)
        if year_str:
            year = int(year_str) if len(year_str) == 4 else 2000 + int(year_str)
        else:
            year = reference_date.year
            if month < reference_date.month or (month == reference_date.month and day < reference_date.day):
                year += 1
        try:
            return datetime(year, month, day)
        except ValueError:
            return None
    
    return None

def parse_time(text: str) -> Optional[Tuple[int, int]]:
    """
    Parse French time expressions into (hour, minute) tuple.
    Handles: 14h, 14h30, 14:30, 2h30 PM, etc.
    """
    text = text.lower().strip().replace(' ', '')
    
    # Pattern: 14h, 14h30, 9h, 9h30
    pattern_h = r'^(\d{1,2})h(\d{2})?$'
    match = re.match(pattern_h, text)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return (hour, minute)
    
    # Pattern: 14:30, 9:00, 2:30
    pattern_colon = r'^(\d{1,2}):(\d{2})$'
    match = re.match(pattern_colon, text)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2))
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return (hour, minute)
    
    # Pattern: 2pm, 2:30pm, 14h du soir
    pattern_ampm = r'^(\d{1,2}):?(\d{2})?(am|pm|du soir|du matin)$'
    match = re.match(pattern_ampm, text)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        period = match.group(3)
        
        if 'pm' in period or 'soir' in period:
            if hour != 12:
                hour += 12
        elif ('am' in period or 'matin' in period) and hour == 12:
            hour = 0
            
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return (hour, minute)
    
    return None

def format_price(price: float, currency: str = "$") -> str:
    """Format price with currency symbol"""
    return f"{price:.0f} {currency}"

def format_distance(km: float) -> str:
    """Format distance in km or m"""
    if km < 1:
        return f"{int(km * 1000)} m"
    return f"{km:.1f} km"

def format_datetime_fr(dt: datetime) -> str:
    """Format datetime in French"""
    days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
              'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    day_name = days[dt.weekday()]
    month_name = months[dt.month - 1]
    
    return f"{day_name} {dt.day} {month_name}"

def generate_booking_id() -> str:
    """Generate unique booking ID"""
    import uuid
    timestamp = datetime.now().strftime("%Y%m%d")
    unique = uuid.uuid4().hex[:6].upper()
    return f"QEP-{timestamp}-{unique}"

def mask_phone(phone: str) -> str:
    """Mask phone number for privacy (Law 25)"""
    if len(phone) >= 10:
        return phone[:3] + "***" + phone[-4:]
    return "***" + phone[-3:] if len(phone) >= 3 else "***"

def validate_address(address: str) -> bool:
    """Basic address validation for Quebec addresses"""
    # Must contain at least a number and street name
    has_number = bool(re.search(r'\d+', address))
    has_street = len(address.strip()) > 5
    return has_number and has_street
