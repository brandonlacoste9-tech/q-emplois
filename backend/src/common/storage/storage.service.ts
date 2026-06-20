import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_BYTES = 1024 * 1024;
const BUCKET = 'provider-documents';

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
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (max 1 Mo).');
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const path = `${userId}/${Date.now()}-${safeName}`;

    if (!this.isConfigured()) {
      this.logger.warn('Supabase Storage not configured — storing as data URL fallback');
      const b64 = buffer.toString('base64');
      return `data:${contentType};base64,${b64}`;
    }

    const baseUrl = this.configService.get<string>('SUPABASE_URL')!.replace(/\/$/, '');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;

    await this.ensureBucket(baseUrl, key);

    const uploadRes = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}/${path}`, {
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
      throw new BadRequestException('Impossible de téléverser le document.');
    }

    return `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  private async ensureBucket(baseUrl: string, key: string): Promise<void> {
    const check = await fetch(`${baseUrl}/storage/v1/bucket/${BUCKET}`, {
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
        id: BUCKET,
        name: BUCKET,
        public: true,
        file_size_limit: MAX_BYTES,
      }),
    });
  }
}
