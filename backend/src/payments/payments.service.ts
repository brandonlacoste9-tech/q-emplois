import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreditsService, CREDIT_PACKS } from '../credits/credits.service';
import { EscrowMilestoneStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CreditsService))
    private readonly creditsService: CreditsService,
    private readonly notificationsService: NotificationsService,
  ) {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2023-10-16' });
    }
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe n\'est pas configuré.');
    }
    return this.stripe;
  }

  async createCreditCheckout(
    userId: string,
    packKey: keyof typeof CREDIT_PACKS,
  ) {
    const pack = CREDIT_PACKS[packKey];
    if (!pack) throw new NotFoundException('Pack invalide.');

    const stripe = this.requireStripe();
    const wallet = await this.creditsService.getBalance(userId);
    let credits: number = pack.credits;
    if (wallet.lifetimeDiscountPercent > 0) {
      credits = Math.ceil(credits * (1 + wallet.lifetimeDiscountPercent / 100));
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Q-Emplois — ${pack.label}`,
              description: `${credits} crédits pour réclamer des tâches`,
            },
            unit_amount: Math.round(pack.priceCad * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packKey,
        credits: String(credits),
        type: 'credit_pack',
      },
      success_url: `${this.configService.get('FRONTEND_URL', 'http://localhost:5173')}/credits?success=1`,
      cancel_url: `${this.configService.get('FRONTEND_URL', 'http://localhost:5173')}/credits?cancelled=1`,
    });

    return { checkoutUrl: session.url ?? null, sessionId: session.id };
  }

  isConfigured(): boolean {
    return this.stripe != null;
  }

  getPublicConfig() {
    return {
      configured: this.stripe != null,
      publishableKey: this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') ?? null,
    };
  }

  async createTaskPaymentCheckout(taskId: string, clientId: string) {
    const stripe = this.requireStripe();
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée.');
    if (task.clientId !== clientId) {
      throw new BadRequestException('Seul le client peut payer cette tâche.');
    }
    if (task.paymentStatus === 'paid') {
      throw new BadRequestException('Cette tâche est déjà payée.');
    }
    if (!['claimed', 'in_progress', 'completed'].includes(task.status)) {
      throw new BadRequestException('Paiement disponible après sélection du travailleur.');
    }

    const amountCad = Number(task.estimatedPrice);
    const frontend = this.configService.get('FRONTEND_URL', 'http://localhost:5173');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Québec emplois — ${task.title}`,
              description: 'Paiement sécurisé pour votre tâche locale',
            },
            unit_amount: Math.round(amountCad * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'task_payment',
        taskId: task.id,
        clientId,
      },
      success_url: `${frontend}/jobs/${task.id}?paid=1`,
      cancel_url: `${frontend}/jobs/${task.id}?cancelled=1`,
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        paymentStatus: 'pending',
        stripeCheckoutSessionId: session.id,
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.requireStripe();
    const secret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new BadRequestException('Webhook secret manquant.');

    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === 'credit_pack') {
        const userId = session.metadata.userId;
        const packKey = session.metadata.packKey as keyof typeof CREDIT_PACKS;
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;

        await this.creditsService.applyPackPurchase(
          userId,
          packKey,
          paymentIntentId ?? session.id,
        );
      } else if (session.metadata?.type === 'task_payment') {
        const taskId = session.metadata.taskId;
        if (taskId) {
          await this.prisma.task.update({
            where: { id: taskId },
            data: {
              paymentStatus: 'paid',
              stripeCheckoutSessionId: session.id,
            },
          });
        }
      }
    }

    return { received: true };
  }

  async createEscrowPaymentIntent(
    clientId: string,
    providerId: string,
    taskDescription: string,
    totalAmount: number,
    milestones: { description: string; amount: number }[],
  ) {
    const stripe = this.requireStripe();

    const contract = await this.prisma.escrowContract.create({
      data: {
        clientId,
        providerId,
        taskDescription,
        totalAmount,
        status: 'pending',
        milestones: {
          create: milestones.map((m) => ({
            description: m.description,
            amount: m.amount,
            status: EscrowMilestoneStatus.PENDING,
          })),
        },
      },
      include: { milestones: true },
    });

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'cad',
      capture_method: 'manual',
      metadata: {
        contractId: contract.id,
        type: 'escrow',
      },
    });

    await this.prisma.escrowContract.update({
      where: { id: contract.id },
      data: {
        stripePaymentIntentId: intent.id,
        status: 'locked',
      },
    });

    await this.prisma.escrowMilestone.updateMany({
      where: { contractId: contract.id },
      data: { status: EscrowMilestoneStatus.LOCKED },
    });

    return {
      contractId: contract.id,
      clientSecret: intent.client_secret,
      milestones: contract.milestones,
    };
  }

  async releaseEscrowMilestone(contractId: string, milestoneId: string, userId: string) {
    const contract = await this.prisma.escrowContract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    if (contract.providerId !== userId && contract.clientId !== userId) {
      throw new BadRequestException('Accès refusé.');
    }

    const milestone = contract.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new NotFoundException('Jalon introuvable.');

    const stripe = this.requireStripe();
    if (contract.stripePaymentIntentId) {
      const amountCents = Math.round(Number(milestone.amount) * 100);
      await stripe.paymentIntents.capture(contract.stripePaymentIntentId, {
        amount_to_capture: amountCents,
      });
    }

    await this.prisma.escrowMilestone.update({
      where: { id: milestoneId },
      data: {
        status: EscrowMilestoneStatus.RELEASED,
        releasedAt: new Date(),
        verifiedBy: userId,
      },
    });

    // Notify both parties
    const amount = `$${Number(milestone.amount).toFixed(2)}`;
    await this.notificationsService.create(
      contract.clientId,
      'escrow_release',
      'Jalon libéré',
      `Un jalon de ${amount} a été libéré pour le contrat « ${contract.taskDescription} ».`,
      { contractId, milestoneId, amount: Number(milestone.amount) },
    );
    await this.notificationsService.create(
      contract.providerId,
      'escrow_release',
      'Paiement reçu',
      `Un paiement de ${amount} a été libéré pour le jalon « ${milestone.description} ».`,
      { contractId, milestoneId, amount: Number(milestone.amount) },
    );

    return { success: true, milestoneId };
  }

  async listEscrowContracts(userId: string) {
    return this.prisma.escrowContract.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
      },
      include: { milestones: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}