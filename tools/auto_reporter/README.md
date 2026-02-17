# Auto-Reporter — Max (TI-GUY) Data-to-Dossier

Script Python qui automatise le reporting hebdomadaire pour Marc et Chris.

## Fonctionnalités

1. **Appelle** `GET /api/traction/summary`
2. **Met à jour** les placeholders dans `docs/WHITEPAPER.md` (X, Y, Z)
3. **Génère** un Status Report HTML (style Navy Leather & Gold)

## Usage

```bash
# Depuis la racine du projet
python tools/auto_reporter/auto_reporter.py

# Avec API personnalisée
QEMPLOIS_API_URL=https://api.qemplois.ca python tools/auto_reporter/auto_reporter.py
```

## Prérequis

- Backend Q-emplois démarré (`cd backend && npm run dev`)
- Python 3.6+

## Sortie

- `docs/WHITEPAPER.md` — Chiffres mis à jour
- `reports/status_report_YYYYMMDD_HHMM.html` — Rapport visuel

Pour générer un PDF : ouvrir le HTML dans un navigateur → Ctrl+P → Enregistrer en PDF.

## Planification (cron / Task Scheduler)

### Linux/macOS (cron hebdomadaire, lundi 9h)

```bash
0 9 * * 1 cd /path/to/q-emplois && python tools/auto_reporter/auto_reporter.py
```

### Windows (Task Scheduler)

Créer une tâche planifiée qui exécute :
```
python C:\Users\north\Qemplois\q-emplois\tools\auto_reporter\auto_reporter.py
```
