import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ enum: ['avatar', 'task', 'message'] })
  @IsIn(['avatar', 'task', 'message'])
  purpose: 'avatar' | 'task' | 'message';

  @IsString()
  data: string;

  @IsString()
  filename: string;

  @IsString()
  contentType: string;
}
