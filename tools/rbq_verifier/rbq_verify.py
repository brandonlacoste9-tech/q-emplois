#!/usr/bin/env python3
"""
RBQ Licence Verifier — Q-emplois
Vérifie une licence RBQ via le Registre des détenteurs de licence (pes.rbq.gouv.qc.ca).
Utilise browser-use pour naviguer et extraire les résultats.

Usage:
  uv run rbq_verify.py 1234-5678
  uv run rbq_verify.py 1234-5678-91
  uv run rbq_verify.py --json 1234-5678

Environnement:
  BROWSER_USE_API_KEY  — Pour ChatBrowserUse (recommandé, cloud.browser-use.com)
  OPENAI_API_KEY       — Alternative: OpenAI (gpt-4o-mini, etc.)
  LLM_PROVIDER         — "browser_use" | "openai" (défaut: browser_use)
  RBQ_CACHE_TTL_HOURS  — Durée du cache en heures (défaut: 24)
"""

import argparse
import asyncio
import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv

# Charger .env depuis la racine du projet
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(Path(__file__).parent / ".env")

RBQ_REGISTRY_URL = "https://www.pes.rbq.gouv.qc.ca/RegistreLicences"

# Format: 8 chiffres (1234-5678) ou 10 chiffres (1234-5678-91)
RBQ_PATTERN = re.compile(r"^\d{4}-\d{4}(-\d{2})?$")

# Cache en mémoire (licence -> (result, timestamp))
_cache: dict[str, tuple[dict, float]] = {}
CACHE_TTL_SEC = float(os.environ.get("RBQ_CACHE_TTL_HOURS", "24")) * 3600


def validate_rbq(licence: str) -> bool:
    """Valide le format RBQ (1234-5678 ou 1234-5678-91)."""
    return bool(RBQ_PATTERN.match(licence))


def normalize_licence(raw: str) -> str | None:
    """Normalise le numéro de licence (accepte 12345678, 1234-5678, 1234-5678-91)."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 8:
        return f"{digits[:4]}-{digits[4:]}"
    if len(digits) == 10:
        return f"{digits[:4]}-{digits[4:8]}-{digits[8:]}"
    return None


def validate_licence_format(licence: str) -> bool:
    """Vérifie le format du numéro RBQ (alias de validate_rbq)."""
    return validate_rbq(licence)


def _get_cached(licence: str) -> dict | None:
    """Retourne le résultat en cache si valide."""
    if licence not in _cache:
        return None
    result, ts = _cache[licence]
    if time.time() - ts > CACHE_TTL_SEC:
        del _cache[licence]
        return None
    return result


def _set_cached(licence: str, result: dict) -> None:
    """Stocke le résultat en cache."""
    _cache[licence] = (result, time.time())


def _fetch_rbq_api_sync(licence: str) -> dict | None:
    """Requête HTTP synchrone vers API RBQ (si disponible)."""
    api_url = f"https://www.pes.rbq.gouv.qc.ca/api/v1/licences/{licence}"
    try:
        import urllib.request

        req = urllib.request.Request(api_url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                return {
                    "valid": True,
                    "licence": licence,
                    "company_name": data.get("company_name"),
                    "neq": data.get("neq"),
                    "categories": data.get("categories", []),
                    "status": "Licence valide (API)",
                    "error": None,
                }
    except Exception:
        pass
    return None


async def _try_rbq_api(licence: str) -> dict | None:
    """
    Tente une requête HTTP vers une API RBQ (si disponible).
    Aucune API publique documentée à ce jour — retourne None.
    À réactiver si le gouvernement québécois publie une API.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _fetch_rbq_api_sync, licence)


async def verify_rbq_browser_use(licence: str, use_cloud: bool = False, skip_cache: bool = False) -> dict:
    """
    Vérifie une licence RBQ via browser-use Agent.
    Retourne un dict structuré pour intégration API/OpenClaw.
    Utilise le cache en mémoire si disponible (TTL configurable).
    """
    if not skip_cache:
        cached = _get_cached(licence)
        if cached is not None:
            return cached

    # Tentative API (actuellement non disponible)
    api_result = await _try_rbq_api(licence)
    if api_result is not None:
        _set_cached(licence, api_result)
        return api_result

    from browser_use import Agent, Browser, ChatBrowserUse, ChatOpenAI

    llm_provider = os.environ.get("LLM_PROVIDER", "browser_use").lower()

    if llm_provider == "openai":
        if not os.environ.get("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY requis pour LLM_PROVIDER=openai")
        llm = ChatOpenAI(model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"))
    else:
        if not os.environ.get("BROWSER_USE_API_KEY"):
            raise ValueError(
                "BROWSER_USE_API_KEY requis. Obtenez une clé sur https://cloud.browser-use.com/new-api-key"
            )
        llm = ChatBrowserUse()

    browser = Browser(use_cloud=use_cloud)

    task = f"""
Tu es un agent qui vérifie les licences RBQ (Régie du bâtiment du Québec).

1. Va sur {RBQ_REGISTRY_URL}
2. Trouve le champ de saisie pour le numéro de licence (format: XXXX-XXXX ou XXXX-XXXX-XX)
3. Entre le numéro: {licence}
4. Soumets le formulaire (bouton Rechercher ou équivalent)
5. Analyse la page de résultat:
   - Si une fiche d'entreprise s'affiche: la licence est VALIDE
   - Si un message d'erreur ou "aucun résultat": la licence est INVALIDE ou introuvable

Retourne un résumé JSON structuré avec EXACTEMENT ces champs:
{{
  "valid": true ou false,
  "licence": "{licence}",
  "company_name": "Nom de l'entreprise ou null",
  "neq": "Numéro d'entreprise du Québec ou null",
  "categories": ["liste des catégories/sous-catégories ou []"],
  "status": "résumé court du statut (ex: Licence valide, Plomberie)",
  "error": null ou "message d'erreur si applicable"
}}

Si un CAPTCHA bloque l'accès, indique error: "CAPTCHA détecté — utilisez Browser Use Cloud (use_cloud=True) ou vérifiez manuellement."
"""

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
    )

    history = await agent.run()

    # Parser le résultat pour extraire le JSON
    result_text = str(history.final_result() or "")
    result = _parse_agent_result(result_text, licence)
    _set_cached(licence, result)
    return result


def _parse_agent_result(text: str, licence: str) -> dict:
    """Extrait le JSON du texte retourné par l'agent."""
    default = {
        "valid": False,
        "licence": licence,
        "company_name": None,
        "neq": None,
        "categories": [],
        "status": "Vérification échouée",
        "error": "Impossible d'extraire le résultat",
    }

    # Chercher un bloc ```json ... ``` ou { ... } avec "valid"
    for block in re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text):
        try:
            parsed = json.loads(block)
            if "valid" in parsed:
                for key in default:
                    if key not in parsed:
                        parsed[key] = default[key]
                return parsed
        except json.JSONDecodeError:
            continue

    # Chercher un objet JSON brut
    brace_start = text.find('{"valid"')
    if brace_start >= 0:
        depth, i = 0, brace_start
        for i, c in enumerate(text[brace_start:], brace_start):
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    try:
                        parsed = json.loads(text[brace_start : i + 1])
                        for key in default:
                            if key not in parsed:
                                parsed[key] = default[key]
                        return parsed
                    except json.JSONDecodeError:
                        break

    # Fallback: détecter valid/invalid dans le texte
    if "valid" in text.lower() and "true" in text.lower():
        default["valid"] = True
        default["status"] = "Licence trouvée (résultat non structuré)"
    elif "invalide" in text.lower() or "aucun résultat" in text.lower() or "not found" in text.lower():
        default["valid"] = False
        default["status"] = "Licence introuvable ou invalide"

    default["error"] = "Résultat non structuré — vérification manuelle recommandée"
    return default


async def main():
    parser = argparse.ArgumentParser(
        description="Vérifie une licence RBQ via le registre officiel"
    )
    parser.add_argument(
        "licence",
        help="Numéro de licence RBQ (ex: 1234-5678 ou 1234-5678-91)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Sortie JSON uniquement",
    )
    parser.add_argument(
        "--cloud",
        action="store_true",
        help="Utiliser Browser Use Cloud (stealth, contourne CAPTCHA)",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Ignorer le cache (forcer une nouvelle vérification)",
    )
    args = parser.parse_args()

    raw = args.licence.strip()
    licence = normalize_licence(raw)

    if not licence or not validate_licence_format(licence):
        err = {
            "valid": False,
            "licence": raw,
            "company_name": None,
            "neq": None,
            "categories": [],
            "status": "Format invalide",
            "error": "Le numéro doit être 8 chiffres (1234-5678) ou 10 chiffres (1234-5678-91)",
        }
        print(json.dumps(err, indent=2, ensure_ascii=False) if args.json else err["error"])
        return 1

    try:
        result = await verify_rbq_browser_use(
            licence, use_cloud=args.cloud, skip_cache=args.no_cache
        )
    except Exception as e:
        result = {
            "valid": False,
            "licence": licence,
            "company_name": None,
            "neq": None,
            "categories": [],
            "status": "Erreur",
            "error": str(e),
        }

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        status = "✓ Valide" if result["valid"] else "✗ Invalide / introuvable"
        print(f"Licence {licence}: {status}")
        if result.get("company_name"):
            print(f"  Entreprise: {result['company_name']}")
        if result.get("neq"):
            print(f"  NEQ: {result['neq']}")
        if result.get("categories"):
            print(f"  Catégories: {', '.join(result['categories'])}")
        if result.get("error"):
            print(f"  Erreur: {result['error']}")

    return 0 if result["valid"] else 1


if __name__ == "__main__":
    exit(asyncio.run(main()))
