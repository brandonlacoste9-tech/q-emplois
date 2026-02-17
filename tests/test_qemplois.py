"""Tests for Q-Emplois bot skills"""

import pytest
from datetime import datetime
from openclaw.skills.qemplois.utils import (
    parse_date, parse_time, format_price, format_distance,
    format_datetime_fr, generate_booking_id, validate_address
)
from openclaw.skills.qemplois.booking_flow import BookingFlow, BookingState
from openclaw.skills.qemplois.auth_handler import AuthHandler
from openclaw.skills.qemplois.job_notifications import JobNotifier, JobRequest

class TestUtils:
    """Test utility functions"""
    
    def test_parse_date_today(self):
        result = parse_date("aujourd'hui")
        assert result is not None
        assert result.date() == datetime.now().date()
    
    def test_parse_date_tomorrow(self):
        result = parse_date("demain")
        assert result is not None
        from datetime import timedelta
        assert result.date() == (datetime.now() + timedelta(days=1)).date()
    
    def test_parse_date_french_month(self):
        result = parse_date("20 février")
        assert result is not None
        assert result.day == 20
        assert result.month == 2
    
    def test_parse_time_simple(self):
        result = parse_time("14h")
        assert result == (14, 0)
    
    def test_parse_time_with_minutes(self):
        result = parse_time("9h30")
        assert result == (9, 30)
    
    def test_parse_time_colon(self):
        result = parse_time("14:30")
        assert result == (14, 30)
    
    def test_format_price(self):
        assert format_price(45.0) == "45 $"
        assert format_price(45.99) == "46 $"
    
    def test_format_distance_km(self):
        assert format_distance(2.5) == "2.5 km"
    
    def test_format_distance_meters(self):
        assert format_distance(0.5) == "500 m"
    
    def test_validate_address_valid(self):
        assert validate_address("123 Rue Sainte-Catherine, Montréal") == True
    
    def test_validate_address_invalid(self):
        assert validate_address("rue") == False

class TestBookingFlow:
    """Test booking conversation flow"""
    
    def setup_method(self):
        self.flow = BookingFlow()
    
    def test_welcome_message(self):
        msg = self.flow.get_welcome_message()
        assert "Bonjour" in msg
        assert "Plomberie" in msg
        assert "Électricité" in msg
    
    def test_service_selection(self):
        # Start
        response = self.flow.handle_message("user1", "telegram", "/start")
        assert "Quel service" in response
        
        # Select service
        response = self.flow.handle_message("user1", "telegram", "1")
        assert "Plomberie" in response or "date" in response.lower()
    
    def test_help_command(self):
        response = self.flow.handle_message("user1", "telegram", "/aide")
        assert "AIDE" in response or "aide" in response

class TestAuthHandler:
    """Test authentication handler"""
    
    def setup_method(self):
        import tempfile
        import os
        self.temp_db = tempfile.mktemp(suffix='.json')
        self.auth = AuthHandler(self.temp_db)
    
    def test_generate_auth_link(self):
        url = self.auth.generate_auth_link("telegram", "123456")
        assert "qemplois.ca/auth" in url
        assert "token=" in url
    
    def test_is_authenticated_false(self):
        assert self.auth.is_authenticated("telegram", "999999") == False

class TestJobNotifier:
    """Test job notification formatting"""
    
    def setup_method(self):
        self.notifier = JobNotifier()
    
    def test_format_new_job_alert(self):
        job = JobRequest(
            booking_id="QEP-2024-001",
            service_type="plomberie",
            date="20 février",
            time="14h",
            location="123 Rue Sainte-Catherine",
            distance_km=2.5,
            client_name="Client",
            price_estimate=90.0
        )
        msg = self.notifier.format_new_job_alert(job)
        assert "NOUVELLE DEMANDE" in msg
        assert "plomberie" in msg.lower()
        assert "90" in msg

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
