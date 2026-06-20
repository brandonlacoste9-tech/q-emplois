import { Controller, Get, Post, Body, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreditsService, CREDIT_PACKS } from './credits.service';
import { PaymentsService } from '../payments/payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { IsIn } from 'class-validator';

class PurchasePackDto {
  @IsIn(['starter', 'standard', 'pro'])
  pack: keyof typeof CREDIT_PACKS;
}

@ApiTags('credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(
    private readonly creditsService: CreditsService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Solde de crédits' })
  getBalance(@CurrentUser('userId') userId: string) {
    return this.creditsService.getBalance(userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Historique des crédits' })
  getTransactions(@CurrentUser('userId') userId: string) {
    return this.creditsService.getTransactions(userId);
  }

  @Get('packs')
  @ApiOperation({ summary: 'Packs de crédits disponibles' })
  getPacks() {
    return CREDIT_PACKS;
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Acheter un pack de crédits via Stripe' })
  async purchase(
    @CurrentUser('userId') userId: string,
    @Body() dto: PurchasePackDto,
  ) {
    return this.paymentsService.createCreditCheckout(userId, dto.pack);
  }
}