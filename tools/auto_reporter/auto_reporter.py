#!/usr/bin/env python3
"""
Auto-Reporter — Max (TI-GUY) Data-to-Dossier
Appelle GET /api/traction/summary, met à jour WHITEPAPER.md et génère un Status Report HTML/PDF.
Esthétique: Navy Leather & Gold (Palette Impériale)
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path

API_URL = os.environ.get("QEMPLOIS_API_URL", "http://localhost:3001")
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


def fetch_summary() -> dict:
    """Récupère le résumé de traction depuis l'API."""
    import urllib.request

    url = f"{API_URL}/api/traction/summary"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def update_whitepaper(data: dict) -> None:
    """Met à jour les placeholders dans WHITEPAPER.md."""
    whitepaper_path = PROJECT_ROOT / "docs" / "WHITEPAPER.md"
    if not whitepaper_path.exists():
        print(f"WHITEPAPER.md introuvable: {whitepaper_path}")
        return

    content = whitepaper_path.read_text(encoding="utf-8")

    replacements = {
        "X leads injectés par Max": f"{data.get('total_leads', 0)} leads injectés par Max",
        "Y revendications enregistrées": f"{data.get('lead_claims', 0)} revendications enregistrées",
        "Z $ en TPS/TVQ tracés": f"{data.get('tps_tvq_traced', 0):,.2f} $ en TPS/TVQ tracés",
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    whitepaper_path.write_text(content, encoding="utf-8")
    print(f"✓ WHITEPAPER.md mis à jour ({whitepaper_path})")


def generate_status_report_html(data: dict) -> str:
    """Génère un rapport HTML style Navy Leather & Gold."""
    theme = {
        "cuir_bleu": "#1F2F3F",
        "or_chaud": "#B87B44",
        "fil_creme": "#D9B38C",
    }
    now = datetime.now().strftime("%d %B %Y — %H:%M")
    conversion = data.get("conversion_rate", 0)
    regions = data.get("by_region", {})

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Status Report — Qué-Emplois</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: 'Crimson Pro', Georgia, serif;
      background: {theme['cuir_bleu']};
      color: {theme['fil_creme']};
      min-height: 100vh;
      padding: 2rem;
    }}
    .container {{
      max-width: 800px;
      margin: 0 auto;
      border: 2px dashed {theme['or_chaud']}80;
      border-radius: 2rem;
      padding: 3rem;
      background: rgba(15, 23, 42, 0.5);
    }}
    h1 {{
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: {theme['fil_creme']};
    }}
    .subtitle {{
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      opacity: 0.6;
      margin-bottom: 2rem;
    }}
    .metrics {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }}
    .metric {{
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(184,123,68,0.3);
      border-radius: 1rem;
      padding: 1.5rem;
      text-align: center;
    }}
    .metric-value {{
      font-size: 2rem;
      font-weight: 700;
      color: {theme['or_chaud']};
    }}
    .metric-label {{
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      opacity: 0.7;
      margin-top: 0.5rem;
    }}
    .grant-magnet {{
      background: linear-gradient(135deg, {theme['or_chaud']}15 0%, transparent 100%);
      border: 2px solid {theme['or_chaud']}60;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }}
    .grant-magnet .value {{
      font-size: 2.5rem;
      font-weight: 700;
      color: {theme['or_chaud']};
    }}
    .regions {{
      font-size: 0.85rem;
      opacity: 0.8;
    }}
    .footer {{
      margin-top: 2rem;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      opacity: 0.5;
    }}
  </style>
</head>
<body>
  <div class="container">
    <h1>🏛️ Status Report</h1>
    <p class="subtitle">Qué-Emplois — Northern Ventures</p>
    <p class="subtitle">Généré le {now}</p>

    <div class="metrics">
      <div class="metric">
        <div class="metric-value">{data.get('total_leads', 0)}</div>
        <div class="metric-label">Leads détectés (Max)</div>
      </div>
      <div class="metric">
        <div class="metric-value">{data.get('lead_claims', 0)}</div>
        <div class="metric-label">Revendications</div>
      </div>
      <div class="metric">
        <div class="metric-value">{conversion}%</div>
        <div class="metric-label">Taux de conversion</div>
      </div>
    </div>

    <div class="grant-magnet">
      <div class="metric-label">Contribution TPS/TVQ (Grant Magnet)</div>
      <div class="value">{data.get('tps_tvq_traced', 0):,.2f} $</div>
      <p style="margin-top: 0.5rem; font-size: 0.8rem; font-style: italic;">
        Montant tracé pour Revenu Québec
      </p>
    </div>

    <div class="regions">
      <strong>Répartition géographique:</strong>
      <pre style="margin-top: 0.5rem; font-size: 0.8rem;">{json.dumps(regions, indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="footer">
      Données souveraines — Hébergées au Québec (Loi 25)
    </div>
  </div>
</body>
</html>
"""
    return html


def main():
    print("Auto-Reporter — Max (TI-GUY) Data-to-Dossier")
    print(f"API: {API_URL}")
    print("-" * 40)

    try:
        data = fetch_summary()
    except Exception as e:
        print(f"Erreur: Impossible de joindre l'API ({e})")
        print("Assurez-vous que le backend est démarré (npm run dev)")
        return 1

    print(f"Leads: {data.get('total_leads', 0)}")
    print(f"Revendications: {data.get('lead_claims', 0)}")
    print(f"TPS/TVQ tracés: {data.get('tps_tvq_traced', 0):,.2f} $")
    print(f"Conversion: {data.get('conversion_rate', 0)}%")

    update_whitepaper(data)

    out_dir = PROJECT_ROOT / "reports"
    out_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    html_path = out_dir / f"status_report_{timestamp}.html"
    html_path.write_text(generate_status_report_html(data), encoding="utf-8")
    print(f"✓ Rapport généré: {html_path}")
    print(f"  Ouvrir dans un navigateur pour prévisualiser, puis imprimer en PDF (Ctrl+P)")

    return 0


if __name__ == "__main__":
    exit(main())
