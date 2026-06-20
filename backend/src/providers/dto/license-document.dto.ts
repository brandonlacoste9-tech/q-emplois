import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Validates that a base64-encoded data URL or raw base64 string
 * doesn't exceed MAX_BYTES once decoded. Prevents 50MB uploads
 * disguised as small JSON payloads.
 */
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
];

export function IsWithinMaxBytes(
  maxBytes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isWithinMaxBytes',
      target: object.constructor,
      propertyName,
      constraints: [maxBytes],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          let b64 = value;
          const match = value.match(/^data:([^;]+);base64,(.+)$/);
          if (match) b64 = match[2];
          try {
            const size = Math.ceil((b64.length * 3) / 4);
            return size <= maxBytes;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return `Le fichier dépasse la taille maximale de ${Math.round(maxBytes / 1024 / 1024)} Mo.`;
        },
      },
    });
  };
}

export class UploadLicenseDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Le contenu du fichier est requis.' })
  @IsWithinMaxBytes(MAX_BYTES, {
    message: 'Le fichier dépasse 5 Mo. Compressez ou recadrez avant de téléverser.',
  })
  data!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom de fichier est requis.' })
  @MaxLength(255)
  filename!: string;

  @IsString()
  @Matches(/^(image\/(png|jpe?g)|application\/pdf)$/, {
    message: 'Format non supporté. Formats acceptés : PNG, JPEG, PDF.',
  })
  contentType!: string;
}

export { ALLOWED_CONTENT_TYPES, MAX_BYTES };