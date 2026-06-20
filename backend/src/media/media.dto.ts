import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ enum: ['avatar', 'task'] })
  @IsIn(['avatar', 'task'])
  purpose: 'avatar' | 'task';

  @IsString()
  data: string;

  @IsString()
  filename: string;

  @IsString()
  contentType: string;
}
