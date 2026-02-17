# RBQ Verifier Skill — OpenClaw / Max (Ti-Guy)

Skill vérifiant les licences RBQ via l'API `POST /api/verify/rbq`.

## Structure

```
skills/rbq_verifier/
├── __init__.py
├── skill.py         # Logique principale
├── config.yaml      # Configuration
├── requirements.txt
└── README.md
```

## Installation

```bash
# Dépendances
pip install -r requirements.txt

# Copier dans OpenClaw (si config externe)
cp -r skills/rbq_verifier ~/.openclaw/skills/

# Ou lier depuis le projet
openclaw skills add --path ./skills/rbq_verifier
```

## Configuration

```env
# .env ou ~/.openclaw/.env
RBQ_API_URL=http://localhost:3001/api/verify/rbq
```

## Prérequis

- Backend Express démarré : `npm run dev` (port 3001)
- Endpoint `POST /api/verify/rbq` opérationnel
- `tools/rbq_verifier` configuré avec `BROWSER_USE_API_KEY`

## Flux exemple

```
[Utilisateur] "Max, vérifie si RBQ 1234-5678 est valide"

[Max] → Appel POST /api/verify/rbq
      → Réponse formatée en français

[Max] ✅ Licence 1234-5678 - VALIDE
      🏢 Entreprise: Plomberie Dupont inc.
      📋 NEQ: 1234567890
      🔧 Catégories: Plomberie, Chauffage
```
