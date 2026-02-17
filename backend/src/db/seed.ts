/**
 * Seed — Données initiales pour développement
 * Exécuter: npx tsx src/db/seed.ts
 */

import 'dotenv/config';
import { db } from './index.js';
import { categories, jobs, pros } from './schema.js';

const CAT_1 = '11111111-1111-1111-1111-111111111101';
const CAT_2 = '11111111-1111-1111-1111-111111111102';
const CAT_3 = '11111111-1111-1111-1111-111111111103';

const JOB_1 = '22222222-2222-2222-2222-222222222201';
const JOB_2 = '22222222-2222-2222-2222-222222222202';
const JOB_3 = '22222222-2222-2222-2222-222222222203';

const PRO_1 = '33333333-3333-3333-3333-333333333301'; // sans RBQ
const PRO_2 = '33333333-3333-3333-3333-333333333302'; // avec RBQ

async function seed() {
  await db.insert(categories).values([
    { id: CAT_1, nameFr: 'Déneigement', requiresRbq: false },
    { id: CAT_2, nameFr: 'Nettoyage', requiresRbq: false },
    { id: CAT_3, nameFr: 'Plomberie', requiresRbq: true },
  ]).onConflictDoNothing({ target: categories.id });

  await db.insert(jobs).values([
    {
      id: JOB_1,
      titleFr: 'Déneigement',
      categoryId: CAT_1,
      description: 'Déneigement résidentiel et commercial.',
      location: 'Montréal, H2X',
      clientBudget: '45',
      budgetType: 'hourly',
    },
    {
      id: JOB_2,
      titleFr: 'Grand Ménage',
      categoryId: CAT_2,
      location: 'Québec, G1R',
      clientBudget: '200',
      budgetType: 'fixed',
    },
    {
      id: JOB_3,
      titleFr: 'Plomberie',
      categoryId: CAT_3,
      location: 'Laval, H7V',
      clientBudget: '85',
      budgetType: 'hourly',
    },
  ]).onConflictDoNothing({ target: jobs.id });

  await db.insert(pros).values([
    { id: PRO_1, rbqLicense: null, identityStatus: 'unverified' },
    {
      id: PRO_2,
      rbqLicense: 'RBQ-1234-5678-90',
      identityStatus: 'verified',
      verifiedAt: new Date(),
    },
  ]).onConflictDoNothing({ target: pros.id });

  console.log('Seed OK. IDs pour le frontend:');
  console.log('  JOB_1:', JOB_1, '(Déneigement)');
  console.log('  JOB_2:', JOB_2, '(Grand Ménage)');
  console.log('  JOB_3:', JOB_3, '(Plomberie)');
  console.log('  PRO_1:', PRO_1, '(sans RBQ, identité non vérifiée)');
  console.log('  PRO_2:', PRO_2, '(avec RBQ, identité vérifiée)');
}

seed().catch(console.error).finally(() => process.exit(0));
