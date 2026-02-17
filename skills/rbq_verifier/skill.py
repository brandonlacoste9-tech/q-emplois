"""
RBQ Verifier Skill — OpenClaw / Max (Ti-Guy)
Vérifie une licence RBQ via l'API POST /api/verify/rbq.
"""

import os
import re
from typing import Any, Dict, Optional

import httpx


class RBQVerifierSkill:
    def __init__(self, config: Dict[str, Any] | None = None):
        config = config or {}
        cfg = config.get("config", {})
        default_url = "http://localhost:3001/api/verify/rbq"
        self.api_endpoint = os.environ.get("RBQ_API_URL", cfg.get("api_endpoint", default_url))
        self.timeout = cfg.get("timeout", 30)

    def extract_rbq_number(self, text: str) -> Optional[str]:
        """Extrait le numéro RBQ d'un message."""
        patterns = [
            r"RBQ[-\s]?(\d{4}[-\s]?\d{4}(?:[-\s]?\d{2})?)",
            r"licence\s+(?:RBQ\s+)?(\d{4}[-\s]?\d{4}(?:[-\s]?\d{2})?)",
            r"(\d{4}[-\s]?\d{4}(?:[-\s]?\d{2})?)",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw = match.group(1).replace(" ", "").replace("-", "")
                if len(raw) == 8:
                    return f"{raw[:4]}-{raw[4:8]}"
                if len(raw) == 10:
                    return f"{raw[:4]}-{raw[4:8]}-{raw[8:10]}"
        return None

    async def verify_licence(self, licence: str) -> Dict[str, Any]:
        """Appelle l'API de vérification RBQ."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.api_endpoint,
                    json={"licence": licence},
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                return {
                    "valid": False,
                    "error": f"Erreur API: {e.response.status_code}",
                    "licence": licence,
                }
            except Exception as e:
                return {
                    "valid": False,
                    "error": f"Erreur de connexion: {str(e)}",
                    "licence": licence,
                }

    async def handle(self, message: str, context: Dict[str, Any] | None = None) -> str:
        """Point d'entrée principal du skill."""
        context = context or {}

        licence = self.extract_rbq_number(message)

        if not licence:
            return (
                "Je peux vérifier une licence RBQ pour vous. "
                "Veuillez me fournir le numéro (format: 1234-5678 ou 1234-5678-91)."
            )

        result = await self.verify_licence(licence)

        if result.get("error"):
            return (
                f"❌ Je n'ai pas pu vérifier la licence **{licence}**.\n"
                f"Erreur: {result['error']}"
            )

        if result.get("valid"):
            categories = result.get("categories", [])
            categories_str = ", ".join(categories) if categories else "Non spécifié"
            return (
                f"✅ **Licence {licence} - VALIDE**\n\n"
                f"🏢 **Entreprise:** {result.get('company_name') or 'N/A'}\n"
                f"📋 **NEQ:** {result.get('neq') or 'N/A'}\n"
                f"🔧 **Catégories:** {categories_str}\n"
                f"📊 **Statut:** {result.get('status', 'Actif')}"
            )

        return (
            f"❌ **Licence {licence} - INVALIDE**\n\n"
            "Cette licence n'est pas valide ou n'existe pas dans le registre RBQ."
        )


# Export pour OpenClaw
skill = RBQVerifierSkill
