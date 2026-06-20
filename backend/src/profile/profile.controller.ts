import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

class UpdateNotificationsDto {
  @IsOptional()
  @IsString()
  telegramId?: string;

  @IsOptional()
  @IsString()
  whatsappId?: string;

  @IsOptional()
  @IsBoolean()
  whatsappNotifyEnabled?: boolean;
}

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Profil complet' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.profileService.getTradesmanProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Mettre à jour le profil' })
  patchProfile(@CurrentUser('userId') userId: string) {
    return this.profileService.getTradesmanProfile(userId);
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Lier Telegram/WhatsApp' })
  updateNotifications(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateNotificationsDto,
  ) {
    return this.profileService.updateNotifications(userId, dto);
  }
}