import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreditTransactionType } from '@prisma/client';

describe('CreditsService', () => {
  let service: CreditsService;
  const wallet = { id: 'wallet-1', userId: 'user-1', balance: 5 };

  const prismaMock = {
    creditWallet: {
      findUnique: jest.fn().mockResolvedValue(wallet),
      update: jest.fn(),
      create: jest.fn(),
    },
    creditTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  };

  const auditMock = { log: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get(CreditsService);
  });

  it('refundCredit increments balance and records refund transaction', async () => {
    await service.refundCredit('user-1', 'task-1', 'Test refund');

    expect(prismaMock.creditWallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: { balance: { increment: 1 } },
    });
    expect(prismaMock.creditTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 1,
        type: CreditTransactionType.refund,
        taskId: 'task-1',
      }),
    });
  });

  it('spendCredit rejects when balance is zero', async () => {
    prismaMock.creditWallet.findUnique.mockResolvedValueOnce({ ...wallet, balance: 0 });

    await expect(
      service.spendCredit('user-1', 'task-1', 'Apply', CreditTransactionType.apply),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('spendCredit decrements balance with apply type', async () => {
    await service.spendCredit('user-1', 'task-1', 'Apply', CreditTransactionType.apply);

    expect(prismaMock.creditWallet.update).toHaveBeenCalledWith({
      where: { id: wallet.id },
      data: { balance: { decrement: 1 } },
    });
    expect(prismaMock.creditTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: -1,
        type: CreditTransactionType.apply,
      }),
    });
  });
});
