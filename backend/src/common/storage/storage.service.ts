import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_DOC_BYTES = 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const BUCKET_DOCS = 'provider-documents';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return !!(
      this.configService.get('SUPABASE_URL') &&
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  async uploadProviderDocument(
    userId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    return this.uploadPublicFile(BUCKET_DOCS, userId, buffer, filename, contentType, MAX_DOC_BYTES);
  }

  async uploadAvatar(
    userId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Seules les images sont acceptées.');
    }
    return this.uploadPublicFile('avatars', userId, buffer, filename, contentType, MAX_IMAGE_BYTES);
  }

  async uploadTaskPhoto(
    userId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Seules les images sont acceptées.');
    }
    return this.uploadPublicFile('task-photos', userId, buffer, filename, contentType, MAX_IMAGE_BYTES);
  }

  parseUploadPayload(data: string, contentType: string): { buffer: Buffer; contentType: string } {
    if (data.startsWith('data:')) {
      const parts = data.split(',');
      if (parts.length < 2) throw new BadRequestException('Format de fichier invalide.');
      
      const meta = parts[0];
      const base64Data = parts.slice(1).join(','); // in case data contains commas, though base64 shouldn't
      
      let mimeType = contentType;
      const mimeMatch = meta.match(/^data:([^;]+)/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
      }
      
      return { buffer: Buffer.from(base64Data, 'base64'), contentType: mimeType };
    }
    return { buffer: Buffer.from(data, 'base64'), contentType };
  }

  private async uploadPublicFile(
    bucket: string,
    userId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
    maxBytes: number,
  ): Promise<string> {
    if (buffer.length > maxBytes) {
      throw new BadRequestException(`Fichier trop volumineux (max ${Math.round(maxBytes / 1024 / 1024)} Mo).`);
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const path = `${userId}/${Date.now()}-${safeName}`;

    if (!this.isConfigured()) {
      this.logger.warn('Supabase Storage not configured — storing as data URL fallback');
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    }

    const baseUrl = this.configService.get<string>('SUPABASE_URL')!.replace(/\/$/, '');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;

    await this.ensureBucket(baseUrl, key, bucket, maxBytes);

    const uploadRes = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      this.logger.error(`Storage upload failed: ${err}`);
      throw new BadRequestException('Impossible de téléverser le fichier.');
    }

    return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }

  private async ensureBucket(baseUrl: string, key: string, bucket: string, maxBytes: number): Promise<void> {
    const check = await fetch(`${baseUrl}/storage/v1/bucket/${bucket}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (check.ok) return;

    await fetch(`${baseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: bucket,
        name: bucket,
        public: true,
        file_size_limit: maxBytes,
      }),
    });
  }
}
