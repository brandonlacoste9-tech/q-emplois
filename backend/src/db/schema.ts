/**
 * Q-emplois — Drizzle Schema
 * Tables: categories, jobs, pros, bids
 * RBQ = Régie du bâtiment du Québec (Loi R-20)
 */

import {
  pgTable,
  text,
  decimal,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────

export const pricingTypeEnum = pgEnum('pricing_type', ['hourly', 'flat_rate']);
export const bidStatusEnum = pgEnum('bid_status', [
  'pending',
  'accepted',
  'rejected',
  'cancelled',
]);

export const identityStatusEnum = pgEnum('identity_status', [
  'unverified',
  'pending',
  'verified',
  'rejected',
]);

// ─── Categories (Plomberie, Électricité, etc. — requires_rbq) ─────────────

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  nameFr: text('name_fr').notNull(),
  requiresRbq: boolean('requires_rbq').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Jobs (Contrats publiés par les clients) ───────────────────────────────

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  titleFr: text('title_fr').notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id, { onDelete: 'restrict' })
    .notNull(),
  description: text('description'),
  location: text('location'),
  clientBudget: decimal('client_budget', { precision: 10, scale: 2 }),
  budgetType: text('budget_type').$type<'hourly' | 'fixed'>(),
  status: text('status').default('ouvert').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Pros (Prestataires / Tradesmen) ───────────────────────────────────────

export const pros = pgTable('pros', {
  id: uuid('id').defaultRandom().primaryKey(),
  rbqLicense: text('rbq_license'),
  identityStatus: identityStatusEnum('identity_status').default('unverified').notNull(),
  identityDocumentUrl: text('identity_document_url'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─── Leads (Opportunités Max TI-GUY → L'Atelier) ──────────────────────────

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  titre: text('titre').notNull(),
  client: text('client').notNull(),
  localisation: text('localisation').notNull(),
  montantNet: decimal('montant_net', { precision: 10, scale: 2 }).notNull(),
  tps: decimal('tps', { precision: 10, scale: 2 }).notNull(),
  tvq: decimal('tvq', { precision: 10, scale: 2 }).notNull(),
  sceauAuthenticite: boolean('sceau_authenticite').default(true).notNull(),
  source: text('source').default('max-ti-guy'),
  proId: uuid('pro_id').references(() => pros.id, { onDelete: 'set null' }),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Traction (Événements haute valeur — Grant Strategy) ───────────────────

export const traction = pgTable('traction', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: text('event_type').notNull(), // 'lead_claim' | 'partner_click'
  proId: uuid('pro_id').references(() => pros.id, { onDelete: 'cascade' }).notNull(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  partnerId: uuid('partner_id'),
  metadata: jsonb('metadata').$type<{ region?: string; device?: string }>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Bids (Soumissions / Offres des Pros) ─────────────────────────────────

export const bids = pgTable('bids', {
  id: uuid('id').defaultRandom().primaryKey(),

  jobId: uuid('job_id')
    .references(() => jobs.id, { onDelete: 'cascade' })
    .notNull(),
  proId: uuid('pro_id')
    .references(() => pros.id, { onDelete: 'cascade' })
    .notNull(),

  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  priceType: pricingTypeEnum('price_type').notNull(),

  message: text('message'),

  status: bidStatusEnum('status').default('pending').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
