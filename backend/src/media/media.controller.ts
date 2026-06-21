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
const MAX_DOC_BYTES   =  5 * 1024 * 1024; //  5 MB

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

  /** Native multipart/form-data upload — images (avatar/task) or documents */
  @Post('upload-file')
  @ApiOperation({ summary: 'Téléverser un fichier (avatar, tâche, ou document) — multipart' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES }, // Multer checks max; per-purpose checked below
      fileFilter: (_req, file, cb) => {
        const allowed = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
        if (!allowed) {
          return cb(new BadRequestException('Type de fichier non accepté (image ou PDF).'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('purpose') purpose: 'avatar' | 'task' | 'document',
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    if (!['avatar', 'task', 'document'].includes(purpose)) {
      throw new BadRequestException('purpose doit être "avatar", "task" ou "document".');
    }
    if (purpose === 'document' && file.size > MAX_DOC_BYTES) {
      throw new BadRequestException('Document trop volumineux (max 5 Mo).');
    }
    return this.mediaService.uploadFile(userId, file, purpose);
  }
}
