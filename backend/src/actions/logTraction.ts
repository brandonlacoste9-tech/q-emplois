/**
 * Traction API — Enregistrement des événements haute valeur
 * lead_claim, partner_click — Données pour subventions et investisseurs
 */

import { db } from '../db/index.js';
import { traction } from '../db/schema.js';
import { z } from 'zod';

const TractionSchema = z.object({
  event_type: z.enum(['lead_claim', 'partner_click']),
  pro_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  partner_id: z.string().uuid().optional(),
  metadata: z
    .object({
      region: z.string().optional(),
      device: z.string().optional(),
    })
    .optional(),
});

export type TractionInput = z.infer<typeof TractionSchema>;

export type TractionResult =
  | { success: true; logEntry: { id: string } }
  | { success: false; error: string };

export async function logTraction(input: TractionInput): Promise<TractionResult> {
  const parsed = TractionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Format invalide. Champs requis: event_type, pro_id.',
    };
  }

  const { event_type, pro_id, lead_id, partner_id, metadata } = parsed.data;

  try {
    const [inserted] = await db
      .insert(traction)
      .values({
        eventType: event_type,
        proId: pro_id,
        leadId: lead_id || null,
        partnerId: partner_id || null,
        metadata: metadata || {},
      })
      .returning({ id: traction.id });

    console.log(`[Max-TI-GUY] Événement de traction enregistré : ${event_type}`);
    return { success: true, logEntry: { id: inserted!.id } };
  } catch (err) {
    console.error('Erreur logTraction:', err);
    return {
      success: false,
      error: "Erreur lors de l'enregistrement de la traction",
    };
  }
}
