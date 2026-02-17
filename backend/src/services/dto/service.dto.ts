import { IsString, IsOptional, IsNumber, IsEnum, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceUnit } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({ example: 'Plumbing Repair' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Réparation de plomberie' })
  @IsString()
  @MaxLength(200)
  nameFr: string;

  @ApiProperty({ example: 'Plomberie' })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiPropertyOptional({ example: 'General plumbing repairs and maintenance' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Réparations et entretien de plomberie générale' })
  @IsOptional()
  @IsString()
  descriptionFr?: string;

  @ApiProperty({ example: 85.00 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ enum: PriceUnit, default: PriceUnit.hour })
  @IsEnum(PriceUnit)
  priceUnit: PriceUnit;

  @ApiPropertyOptional({ example: 'wrench' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameFr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionFr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ enum: PriceUnit })
  @IsOptional()
  @IsEnum(PriceUnit)
  priceUnit?: PriceUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}