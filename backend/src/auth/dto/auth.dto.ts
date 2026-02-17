import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsBoolean, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LanguagePreference } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'jean.dupont@email.com' })
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide.' })
  email: string;

  @ApiProperty({ example: '5141234567' })
  @IsOptional()
  @IsPhoneNumber('CA', { message: 'Veuillez fournir un numéro de téléphone valide au Canada.' })
  phone?: string;

  @ApiProperty({ example: 'MotDePasse123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(100, { message: 'Le mot de passe ne peut pas dépasser 100 caractères.' })
  password: string;

  @ApiPropertyOptional({ enum: LanguagePreference, default: LanguagePreference.fr })
  @IsOptional()
  @IsEnum(LanguagePreference, { message: 'La langue doit être "fr" ou "en".' })
  languagePreference?: LanguagePreference;

  @ApiProperty({ description: 'Consentement Loi 25 requis' })
  @IsBoolean({ message: 'Le consentement est requis pour la collecte des données personnelles.' })
  consentGiven: boolean;

  @ApiPropertyOptional({ example: 'Jean' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Dupont' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jean.dupont@email.com' })
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide.' })
  email: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(1, { message: 'Le mot de passe est requis.' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString({ message: 'Le token de rafraîchissement est requis.' })
  refreshToken: string;
}

export class LinkTelegramDto {
  @ApiProperty()
  @IsString()
  telegramId: string;
}

export class LinkWhatsappDto {
  @ApiProperty()
  @IsString()
  whatsappId: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    role: string;
    languagePreference: string;
  };
}