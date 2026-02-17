---
name: rbq_verifier
description: Vérifie la validité d'une licence RBQ (Régie du bâtiment du Québec) dans le registre officiel.
parameters:
  type: object
  properties:
    licence:
      type: string
      description: Numéro de licence RBQ (format 1234-5678 ou 1234-5678-91)
  required:
    - licence
---

**Déclencheurs**
- "vérifier RBQ 1234-5678"
- "licence RBQ valide?"
- "numéro RBQ 1234-5678-91"

**Flow**
1. Détecter ou extraire le numéro RBQ du message utilisateur.
2. Appeler `POST /api/verify/rbq` avec `{"licence": "1234-5678"}`.
3. Formater la réponse en français (valide/invalide, entreprise, NEQ, catégories).

**Réponse si valide**
- ✅ Licence XXXX-XXXX - VALIDE
- Entreprise, NEQ, catégories, statut

**Réponse si invalide**
- ❌ Licence introuvable ou invalide dans le registre RBQ

**Error handling**
- Pas de numéro fourni → demander le format (1234-5678 ou 1234-5678-91).
- API indisponible → informer l'utilisateur de réessayer plus tard.
