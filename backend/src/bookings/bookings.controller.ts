import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  CancelBookingDto,
} from './dto/booking.dto';
import { UserRole } from '@prisma/client';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une réservation (Q-Business)' })
  create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes réservations' })
  listMine(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.bookingsService.findByUser(userId, role);
  }

  @Get(':id')
  get(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.bookingsService.findById(id, userId, role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto, userId, role);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(id, dto, userId, role);
  }
}