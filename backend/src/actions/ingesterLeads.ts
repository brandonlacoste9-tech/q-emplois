/**
 * Ingester Leads — Pont Max (TI-GUY) → L'Atelier
 * Reçoit le JSON de Max et l'insère dans la table leads
 */

import { db } from '../db/index.js';
import { leads } from '../db/schema.js';
import { z } from 'zod';

const LeadSchema = z.object({
  titre: z.string().min(1),
  client: z.string().min(1),
  localisation: z.string().min(1),
  montant_net: z.number().min(0),
  tps: z.number().min(0),
  tvq: z.number().min(0),
  sceau_authenticite: z.boolean().default(true),
});

export type LeadInput = z.infer<typeof LeadSchema>;

export type IngestResult =
  | { success: true; leadId: string }
  | { success: false; message: string };

export async function ingesterLead(input: LeadInput): Promise<IngestResult> {
  const parsed = LeadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Format invalide. Champs requis: titre, client, localisation, montant_net, tps, tvq.',
    };
  }

  const { titre, client, localisation, montant_net, tps, tvq, sceau_authenticite } =
    parsed.data;

  try {
    const [inserted] = await db
      .insert(leads)
      .values({
        titre,
        client,
        localisation,
        montantNet: montant_net.toString(),
        tps: tps.toString(),
        tvq: tvq.toString(),
        sceauAuthenticite: sceau_authenticite,
        source: 'max-ti-guy',
      })
      .returning({ id: leads.id });

    return {
      success: true,
      leadId: inserted!.id,
    };
  } catch (err) {
    console.error('Erreur ingesterLead:', err);
    return {
      success: false,
      message: "Erreur lors de l'enregistrement du lead.",
    };
  }
}
