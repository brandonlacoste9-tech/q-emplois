# Q-emplois Backend

API + Drizzle + Neon pour les soumissions (bids).

## Setup

1. **Variables d'environnement**
   ```bash
   cp .env.example .env
   # Remplir DATABASE_URL avec l'URL Neon (projet "red ocean")
   ```

2. **Migrations**
   ```bash
   npm run db:push
   # ou: npm run db:migrate
   ```

3. **Seed (données de dev)**
   ```bash
   npm run db:seed
   ```

4. **Démarrer l'API**
   ```bash
   npm run dev
   ```
   → http://localhost:3001

## Endpoints

| Méthode | Route       | Description                    |
|---------|-------------|--------------------------------|
| POST    | /api/bids   | Soumettre une offre (Pro)      |

## RBQ Gatekeeper

Le serveur vérifie côté base que le Pro possède une licence RBQ valide pour les catégories qui l'exigent (Plomberie, Électricité, etc.). Toute tentative de contournement frontend est bloquée.
