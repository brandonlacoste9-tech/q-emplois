/**
 * Notaire Numérique — Server-side validation & RBQ Gatekeeper
 * Valide les soumissions, vérifie la licence RBQ (Loi R-20), insère dans bids
 */

import { db } from '../db/index.js';
import { bids, jobs, pros, categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const SoumissionSchema = z.object({
  jobId: z.string().uuid(),
  proId: z.string().uuid(),
  price: z.number().min(20, 'Le tarif minimum sur Q-emplois est de 20 $'),
  priceType: z.enum(['hourly', 'flat_rate']),
  message: z.string().max(500).optional(),
});

export type SoumissionInput = z.infer<typeof SoumissionSchema>;

export type SoumissionResult =
  | { success: true; message: string; bidId?: string }
  | { success: false; message: string; errors?: Record<string, string[]> };

export async function soumettreOffre(
  input: SoumissionInput
): Promise<SoumissionResult> {
  const parsed = SoumissionSchema.safeParse({
    ...input,
    message: input.message || '',
  });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Veuillez corriger les erreurs dans le formulaire.',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { jobId, proId, price, priceType, message } = parsed.data;

  try {
    // Récupérer le job avec sa catégorie
    const [job] = await db
      .select({
        id: jobs.id,
        categoryId: jobs.categoryId,
        categoryRequiresRbq: categories.requiresRbq,
      })
      .from(jobs)
      .innerJoin(categories, eq(jobs.categoryId, categories.id))
      .where(eq(jobs.id, jobId));

    const [pro] = await db
      .select({
        id: pros.id,
        rbqLicense: pros.rbqLicense,
        identityStatus: pros.identityStatus,
      })
      .from(pros)
      .where(eq(pros.id, proId));

    if (!job || !pro) {
      return {
        success: false,
        message: 'Contrat ou profil introuvable.',
      };
    }

    // RBQ Gatekeeper — Blocage légal
    if (job.categoryRequiresRbq && !pro.rbqLicense?.trim()) {
      return {
        success: false,
        message:
          '⛔ BLOQUÉ PAR LE SYSTÈME : Tentative de soumission illégale sans licence RBQ valide.',
      };
    }

    // Identity Gatekeeper — Sceau de Confiance
    if (pro.identityStatus !== 'verified') {
      return {
        success: false,
        message:
          '🔒 IDENTITÉ REQUISE : Pour la sécurité du réseau, votre identité doit être validée (Permis/RAMQ) avant de soumissionner.',
      };
    }

    // Insert
    const [inserted] = await db
      .insert(bids)
      .values({
        jobId,
        proId,
        price: price.toString(),
        priceType: priceType as 'hourly' | 'flat_rate',
        message: message?.trim() || null,
      })
      .returning({ id: bids.id });

    return {
      success: true,
      message: 'Votre offre a été envoyée au client avec succès.',
      bidId: inserted?.id,
    };
  } catch (err) {
    console.error('Erreur technique soumission:', err);
    return {
      success: false,
      message:
        "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
    };
  }
}
