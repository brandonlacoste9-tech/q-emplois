import { IsEmail, IsString, IsOptional, MaxLength, IsEnum, IsPhoneNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LanguagePreference } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'jean.dupont@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide.' })
  email?: string;

  @ApiPropertyOptional({ example: '5141234567' })
  @IsOptional()
  @IsPhoneNumber('CA', { message: 'Veuillez fournir un numéro de téléphone valide.' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Jean' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères.' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Dupont' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères.' })
  lastName?: string;

  @ApiPropertyOptional({ enum: LanguagePreference })
  @IsOptional()
  @IsEnum(LanguagePreference)
  languagePreference?: LanguagePreference;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ description: 'Ancien mot de passe' })
  @IsString()
  @MaxLength(100)
  oldPassword: string;

  @ApiPropertyOptional({ description: 'Nouveau mot de passe', minLength: 8 })
  @IsString()
  @MaxLength(100)
  newPassword: string;
}

export class RequestDataDeletionDto {
  @ApiPropertyOptional({ description: 'Raison de la demande de suppression' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}