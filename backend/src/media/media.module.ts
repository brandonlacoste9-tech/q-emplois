import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [
    StorageModule,
    MulterModule.register({ dest: undefined }), // memory storage only
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
