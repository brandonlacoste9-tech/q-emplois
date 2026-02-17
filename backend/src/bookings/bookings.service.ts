import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { BookingStateMachine } from './state-machine/booking.state-machine';
import { CreateBookingDto, UpdateBookingStatusDto, CancelBookingDto } from './dto/booking.dto';
import { BookingStatus, UserRole } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly stateMachine: BookingStateMachine,
  ) {}

  async create(clientId: string, dto: CreateBookingDto) {
    // Verify provider exists and is verified
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Prestataire non trouvé.');
    }

    if (!provider.isVerified) {
      throw new BadRequestException('Ce prestataire n\'est pas encore vérifié.');
    }

    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service non trouvé ou inactif.');
    }

    // Calculate price estimate
    const priceEstimate = Number(service.basePrice) * dto.durationHours;

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        clientId,
        providerId: dto.providerId,
        serviceId: dto.serviceId,
        status: BookingStatus.pending,
        scheduledDate: new Date(dto.scheduledDate),
        durationHours: dto.durationHours,
        locationAddress: dto.locationAddress,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        priceEstimate,
        description: dto.description,
        statusHistory: [{
          status: BookingStatus.pending,
          at: new Date().toISOString(),
          by: clientId,
        }],
      },
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      userId: clientId,
      action: 'booking_created',
      resource: 'booking',
      resourceId: booking.id,
      details: { providerId: dto.providerId, serviceId: dto.serviceId },
    });

    return booking;
  }

  async findByUser(userId: string, role: UserRole) {
    const where: any = {};

    if (role === UserRole.client) {
      where.clientId = userId;
    } else if (role === UserRole.provider) {
      const provider = await this.prisma.provider.findUnique({
        where: { userId },
      });
      if (provider) {
        where.providerId = provider.id;
      }
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(bookingId: string, userId: string, role: UserRole) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée.');
    }

    // Check permissions
    const isClient = booking.clientId === userId;
    const isProvider = booking.provider.userId === userId;
    
    if (role !== UserRole.admin && !isClient && !isProvider) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette réservation.');
    }

    return booking;
  }

  async updateStatus(
    bookingId: string,
    dto: UpdateBookingStatusDto,
    userId: string,
    role: UserRole,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée.');
    }

    // Validate state transition
    this.stateMachine.validateTransition(booking.status, dto.status, role.toLowerCase());

    const statusHistory = (booking.statusHistory as any[]) || [];
    statusHistory.push({
      status: dto.status,
      at: new Date().toISOString(),
      by: userId,
      reason: dto.reason,
    });

    const updateData: any = {
      status: dto.status,
      statusHistory,
    };

    // Set timestamp based on status
    if (dto.status === BookingStatus.confirmed) {
      updateData.confirmedAt = new Date();
    } else if (dto.status === BookingStatus.in_progress) {
      updateData.startedAt = new Date();
    } else if (dto.status === BookingStatus.completed) {
      updateData.completedAt = new Date();
      updateData.finalPrice = booking.priceEstimate; // Can be adjusted
    } else if (dto.status === BookingStatus.cancelled) {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = dto.reason;
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      userId,
      action: 'booking_status_updated',
      resource: 'booking',
      resourceId: bookingId,
      details: { oldStatus: booking.status, newStatus: dto.status },
    });

    return updated;
  }

  async confirm(bookingId: string, userId: string, role: UserRole) {
    return this.updateStatus(
      bookingId,
      { status: BookingStatus.confirmed },
      userId,
      role,
    );
  }

  async cancel(
    bookingId: string,
    dto: CancelBookingDto,
    userId: string,
    role: UserRole,
  ) {
    return this.updateStatus(
      bookingId,
      { status: BookingStatus.cancelled, reason: dto.reason },
      userId,
      role,
    );
  }
}