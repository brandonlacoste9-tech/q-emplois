import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsDateString, Min, MaxLength, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID du prestataire' })
  @IsUUID()
  providerId: string;

  @ApiProperty({ description: 'ID du service' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Date et heure prévues', example: '2026-02-20T14:00:00Z' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ description: 'Durée estimée en heures', example: 2.5 })
  @IsNumber()
  @Min(0.5)
  durationHours: number;

  @ApiProperty({ description: 'Adresse du service' })
  @IsString()
  @MaxLength(500)
  locationAddress: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @ApiPropertyOptional({ description: 'Description du travail à effectuer' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, description: 'Nouveau statut' })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiPropertyOptional({ description: 'Raison du changement' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelBookingDto {
  @ApiProperty({ description: 'Raison de l\'annulation' })
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class BookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  providerId: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty()
  scheduledDate: Date;

  @ApiProperty()
  durationHours: number;

  @ApiProperty()
  locationAddress: string;

  @ApiProperty()
  priceEstimate: number;

  @ApiProperty()
  createdAt: Date;
}