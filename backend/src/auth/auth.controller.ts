import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  LinkTelegramDto,
  LinkWhatsappDto,
  AuthResponseDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscription d\'un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides ou consentement manquant' })
  @ApiResponse({ status: 409, description: 'Email ou téléphone déjà utilisé' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.register(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  @ApiResponse({ status: 200, description: 'Token rafraîchi', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Token de rafraîchissement invalide' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(@CurrentUser('userId') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Déconnexion réussie' };
  }

  @Post('telegram/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lier un compte Telegram' })
  @ApiResponse({ status: 200, description: 'Compte Telegram lié avec succès' })
  @ApiResponse({ status: 409, description: 'Ce compte Telegram est déjà lié' })
  async linkTelegram(
    @CurrentUser('userId') userId: string,
    @Body() dto: LinkTelegramDto,
  ): Promise<{ message: string }> {
    await this.authService.linkTelegram(userId, dto.telegramId);
    return { message: 'Compte Telegram lié avec succès' };
  }

  @Post('whatsapp/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lier un compte WhatsApp' })
  @ApiResponse({ status: 200, description: 'Compte WhatsApp lié avec succès' })
  @ApiResponse({ status: 409, description: 'Ce compte WhatsApp est déjà lié' })
  async linkWhatsapp(
    @CurrentUser('userId') userId: string,
    @Body() dto: LinkWhatsappDto,
  ): Promise<{ message: string }> {
    await this.authService.linkWhatsapp(userId, dto.whatsappId);
    return { message: 'Compte WhatsApp lié avec succès' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les informations de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Informations utilisateur' })
  async me(@CurrentUser() user: any) {
    return { user };
  }
}