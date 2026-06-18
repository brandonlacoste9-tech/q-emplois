import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Profil tasker (format frontend)' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.profileService.getTradesmanProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Alias PATCH profil' })
  patchProfile(@CurrentUser('userId') userId: string) {
    return this.profileService.getTradesmanProfile(userId);
  }
}