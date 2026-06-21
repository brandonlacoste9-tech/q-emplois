import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { UploadImageDto } from './media.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async upload(userId: string, dto: UploadImageDto) {
    const { buffer, contentType } = this.storageService.parseUploadPayload(dto.data, dto.contentType);

    if (dto.purpose === 'avatar') {
      const url = await this.storageService.uploadAvatar(userId, buffer, dto.filename, contentType);
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: url },
      });
      return { url, purpose: 'avatar' };
    }

    const url = await this.storageService.uploadTaskPhoto(userId, buffer, dto.filename, contentType);
    return { url, purpose: 'task' };
  }

  /** Multipart upload — buffer comes directly from Multer, no base64 overhead */
  async uploadFile(userId: string, file: Express.Multer.File, purpose: 'avatar' | 'task' | 'document') {
    if (purpose === 'avatar') {
      const url = await this.storageService.uploadAvatar(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: url },
      });
      return { url, purpose: 'avatar' };
    }

    if (purpose === 'document') {
      const url = await this.storageService.uploadProviderDocument(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      await this.prisma.provider.upsert({
        where: { userId },
        create: { userId, serviceTypes: [], licenseDocumentUrl: url, isVerified: false },
        update: { licenseDocumentUrl: url, isVerified: false, verifiedAt: null },
      });
      return { url, purpose: 'document' };
    }

    const url = await this.storageService.uploadTaskPhoto(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return { url, purpose: 'task' };
  }
}
