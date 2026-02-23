import { Module } from '@nestjs/common';
import { EventService } from './services/event.service';
import { UploadController } from './controllers/upload.controller';
import { OssService } from './services/oss.service';

@Module({
  controllers: [UploadController],
  providers: [EventService, OssService],
  exports: [EventService, OssService], // 导出，让其他模块也能用
})
export class CommonModule {}
