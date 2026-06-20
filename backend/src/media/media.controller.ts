import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadImageDto } from './media.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Téléverser une photo (avatar ou tâche)' })
  upload(@CurrentUser('userId') userId: string, @Body() dto: UploadImageDto) {
    return this.mediaService.upload(userId, dto);
  }
}
