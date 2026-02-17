# Pont Max (TI-GUY) → L'Atelier

Ce pont permet à **Max** (agent Browser-use) d'injecter les leads qu'il détecte directement dans la base de données Q-emplois, pour affichage dans L'Atelier.

## Format JSON (Max)

```json
{
  "titre": "Nom du contrat",
  "client": "Nom de l'entreprise",
  "localisation": "Ville, QC",
  "montant_net": 1450.00,
  "tps": 72.50,
  "tvq": 144.64,
  "sceau_authenticite": true
}
```

## Utilisation

### 1. Via fichier JSON

```bash
python push_lead.py lead.json
```

### 2. Via stdin (depuis Max / pipe)

```bash
echo '{"titre":"Plomberie Résidence","client":"Ville-Marie Inc.","localisation":"Montréal, QC","montant_net":1450,"tps":72.5,"tvq":144.64,"sceau_authenticite":true}' | python push_lead.py
```

### 3. API URL personnalisée

```bash
QEMPLOIS_API_URL=https://api.qemplois.ca python push_lead.py lead.json
```

## Prérequis

- Backend Q-emplois démarré (`cd backend && npm run dev`)
- Python 3.6+

## Intégration Max (Browser-use)

Dans ton agent, après avoir extrait un lead :

```python
# Exemple : Max a scrapé un job et a le dict
lead = {
    "titre": job_title,
    "client": company_name,
    "localisation": location,
    "montant_net": net_amount,
    "tps": net_amount * 0.05,
    "tvq": net_amount * 0.09975,
    "sceau_authenticite": True
}

# Option A : Écrire dans un fichier puis appeler le script
with open("/tmp/lead.json", "w") as f:
    json.dump(lead, f)
subprocess.run(["python", "tools/max_bridge/push_lead.py", "/tmp/lead.json"])

# Option B : Appel HTTP direct
import requests
requests.post("http://localhost:3001/api/leads", json=lead)
```
