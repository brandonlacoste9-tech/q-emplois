import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingStateMachine } from './state-machine/booking.state-machine';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingStateMachine],
  exports: [BookingsService],
})
export class BookingsModule {}