import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadImageDto } from './media.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { memoryStorage } from 'multer';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /** Legacy JSON / base64 upload (kept for backward compat) */
  @Post('upload')
  @ApiOperation({ summary: 'Téléverser une photo (avatar ou tâche) — JSON base64' })
  upload(@CurrentUser('userId') userId: string, @Body() dto: UploadImageDto) {
    return this.mediaService.upload(userId, dto);
  }

  /** Native multipart/form-data upload — no base64 overhead */
  @Post('upload-file')
  @ApiOperation({ summary: 'Téléverser une photo (avatar ou tâche) — multipart' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Seules les images sont acceptées.'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('purpose') purpose: 'avatar' | 'task',
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    if (!['avatar', 'task'].includes(purpose)) {
      throw new BadRequestException('purpose doit être "avatar" ou "task".');
    }
    return this.mediaService.uploadFile(userId, file, purpose);
  }
}
