import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { IsString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class MilestoneDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

class CreateEscrowDto {
  @IsString()
  providerId: string;

  @IsString()
  taskDescription: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones: MilestoneDto[];
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(
      req.rawBody as Buffer,
      signature,
    );
  }

  @Post('escrow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un contrat escrow (L\'Atelier)' })
  createEscrow(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEscrowDto,
  ) {
    return this.paymentsService.createEscrowPaymentIntent(
      userId,
      dto.providerId,
      dto.taskDescription,
      dto.totalAmount,
      dto.milestones,
    );
  }

  @Post('escrow/:contractId/milestones/:milestoneId/release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  releaseMilestone(
    @Param('contractId') contractId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.releaseEscrowMilestone(
      contractId,
      milestoneId,
      userId,
    );
  }

  @Get('escrow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listEscrow(@CurrentUser('userId') userId: string) {
    return this.paymentsService.listEscrowContracts(userId);
  }
}