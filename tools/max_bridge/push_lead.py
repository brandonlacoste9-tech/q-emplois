#!/usr/bin/env python3
"""
Pont Max (TI-GUY) → L'Atelier
Envoie un lead JSON vers l'API Q-emplois pour injection dans le dashboard Pro.

Usage:
  python push_lead.py lead.json
  echo '{"titre":"...","client":"...","localisation":"...","montant_net":1450,"tps":72.5,"tvq":144.64,"sceau_authenticite":true}' | python push_lead.py
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

API_URL = os.environ.get("QEMPLOIS_API_URL", "http://localhost:3001")


def push_lead(data: dict) -> dict:
    """POST le lead vers /api/leads."""
    url = f"{API_URL}/api/leads"
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def main():
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
        if not path.exists():
            print(f"Fichier introuvable: {path}", file=sys.stderr)
            sys.exit(1)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    result = push_lead(data)
    if result.get("success"):
        print(f"Lead injecté: {result.get('leadId', 'OK')}")
    else:
        print(f"Erreur: {result.get('message', 'Inconnu')}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
