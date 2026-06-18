import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreditTransactionType } from '@prisma/client';

export const CREDIT_PACKS = {
  starter: { credits: 12, priceCad: 17.99, label: '12 crédits' },
  standard: { credits: 24, priceCad: 34.99, label: '24 crédits' },
  pro: { credits: 60, priceCad: 84.99, label: '60 crédits' },
} as const;

const FOUNDING_TASKER_LIMIT = 50;
const FOUNDING_TASKER_BONUS = 60;

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async ensureWallet(userId: string) {
    let wallet = await this.prisma.creditWallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.creditWallet.create({
        data: { userId, balance: 0 },
      });
    }
    return wallet;
  }

  async maybeGrantFoundingTaskerBonus(userId: string) {
    const wallet = await this.ensureWallet(userId);
    if (wallet.isFoundingTasker) return wallet;

    const foundingCount = await this.prisma.creditWallet.count({
      where: { isFoundingTasker: true },
    });

    if (foundingCount >= FOUNDING_TASKER_LIMIT) return wallet;

    const updated = await this.prisma.creditWallet.update({
      where: { userId },
      data: {
        balance: { increment: FOUNDING_TASKER_BONUS },
        isFoundingTasker: true,
        lifetimeDiscountPercent: 20,
        foundingTaskerNumber: foundingCount + 1,
      },
    });

    await this.prisma.creditTransaction.create({
      data: {
        walletId: updated.id,
        amount: FOUNDING_TASKER_BONUS,
        type: CreditTransactionType.bonus,
        description: 'Bonus Founding Tasker — 60 crédits gratuits',
      },
    });

    await this.auditService.log({
      userId,
      action: 'founding_tasker_bonus',
      resource: 'credit_wallet',
      resourceId: updated.id,
      details: { bonus: FOUNDING_TASKER_BONUS, number: foundingCount + 1 },
    });

    return updated;
  }

  async getBalance(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return {
      balance: wallet.balance,
      isFoundingTasker: wallet.isFoundingTasker,
      lifetimeDiscountPercent: wallet.lifetimeDiscountPercent,
      foundingTaskerNumber: wallet.foundingTaskerNumber,
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return this.prisma.creditTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async spendCredit(userId: string, taskId: string, description: string) {
    const wallet = await this.ensureWallet(userId);
    if (wallet.balance < 1) {
      throw new BadRequestException(
        'Crédits insuffisants. Achetez un pack pour réclamer des tâches.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.creditWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: 1 } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -1,
          type: CreditTransactionType.claim,
          description,
          taskId,
        },
      }),
    ]);
  }

  async addCredits(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    description: string,
    stripePaymentIntentId?: string,
  ) {
    const wallet = await this.ensureWallet(userId);
    await this.prisma.$transaction([
      this.prisma.creditWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type,
          description,
          stripePaymentIntentId,
        },
      }),
    ]);
    return this.getBalance(userId);
  }

  async applyPackPurchase(
    userId: string,
    packKey: keyof typeof CREDIT_PACKS,
    stripePaymentIntentId: string,
  ) {
    const pack = CREDIT_PACKS[packKey];
    if (!pack) throw new NotFoundException('Pack de crédits invalide.');

    const wallet = await this.ensureWallet(userId);
    let credits: number = pack.credits;
    if (wallet.lifetimeDiscountPercent > 0) {
      credits = Math.ceil(credits * (1 + wallet.lifetimeDiscountPercent / 100));
    }

    return this.addCredits(
      userId,
      credits,
      CreditTransactionType.purchase,
      `Achat ${pack.label}`,
      stripePaymentIntentId,
    );
  }
}