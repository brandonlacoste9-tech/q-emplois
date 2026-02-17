# RBQ Licence Verifier — Q-emplois

Vérifie les licences RBQ (Régie du bâtiment du Québec) via le [Registre des détenteurs de licence](https://www.pes.rbq.gouv.qc.ca/RegistreLicences) en utilisant **browser-use**.

## Structure du registre RBQ

| Élément | Détail |
|---------|--------|
| **URL** | https://www.pes.rbq.gouv.qc.ca/RegistreLicences |
| **Format licence** | 8 chiffres (`1234-5678`) ou 10 chiffres (`1234-5678-91`) |
| **Données retournées** | Nom entreprise, NEQ, catégories, répondants, cautionnement |
| **CAPTCHA** | La recherche avancée peut afficher un CAPTCHA — utiliser `--cloud` si bloqué |

## Installation

```bash
cd tools/rbq_verifier
uv sync
uvx browser-use install   # Installe Chromium
```

## Configuration

Créez un fichier `.env` (ou utilisez celui à la racine du projet) :

```env
# Option 1 — ChatBrowserUse (recommandé, 3-5x plus rapide)
# Clé gratuite : https://cloud.browser-use.com/new-api-key
BROWSER_USE_API_KEY=your-key

# Option 2 — OpenAI
BROWSER_USE_API_KEY=
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
```

## Usage

```bash
# Vérification simple
uv run rbq_verify.py 1234-5678

# Format 10 chiffres
uv run rbq_verify.py 1234-5678-91

# Sortie JSON (pour intégration API)
uv run rbq_verify.py --json 1234-5678

# Contourner CAPTCHA (Browser Use Cloud)
uv run rbq_verify.py --cloud 1234-5678
```

## Sortie JSON

```json
{
  "valid": true,
  "licence": "1234-5678",
  "company_name": "Entreprise XYZ inc.",
  "neq": "1234567890",
  "categories": ["Plomberie", "Chauffage"],
  "status": "Licence valide",
  "error": null
}
```

## Intégration avec le backend Express

L'endpoint **`POST /api/verify/rbq`** est déjà implémenté dans le backend :

```bash
curl -X POST http://localhost:3001/api/verify/rbq \
  -H "Content-Type: application/json" \
  -d '{"licence": "1234-5678"}'
```

**Prérequis :** `uv` dans le PATH, `tools/rbq_verifier` configuré avec `BROWSER_USE_API_KEY`.

### Skill OpenClaw (à venir)

Max (Ti-Guy) pourra appeler `POST /api/verify/rbq` quand un utilisateur demande « Vérifie ma licence RBQ-1234-5678 ».

## Cache et rate limiting

- **Cache en mémoire** : TTL 24h par défaut (`RBQ_CACHE_TTL_HOURS`)
- **Validation regex** : Rejette les formats invalides avant toute requête
- **`--no-cache`** : Force une nouvelle vérification

## API RBQ officielle

Aucune API REST publique documentée à ce jour. L’URL hypothétique
`https://www.pes.rbq.gouv.qc.ca/api/v1/licences/{licence}` retourne 404.
Le script tente cette requête en premier ; si une API est publiée plus tard
(portail [api.gouv.qc.ca](https://portail.api.gouv.qc.ca/)), elle sera utilisée automatiquement.

## CAPTCHA et Browser Use Cloud

Le site RBQ peut afficher un CAPTCHA sur certaines recherches. Solutions :

1. **`--cloud`** — Utilise Browser Use Cloud (navigateur stealth, contourne la plupart des CAPTCHAs)
2. **Vérification manuelle** — Pour les cas bloqués, l'utilisateur peut vérifier sur le site officiel
3. **OCR + cache** — Pour les prestataires existants : stocker le résultat en base après première vérification

## Licence

Interne — Q-emplois. Données du registre RBQ — usage conforme aux conditions du site gouvernemental.
