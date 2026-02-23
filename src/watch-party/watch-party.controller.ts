import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OssService } from '../common/services/oss.service';

@ApiTags('WatchParty')
@Controller('watch-party')
export class WatchPartyController {
  constructor(private readonly ossService: OssService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传视频文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|webm|ogg)$/)) {
          return cb(new BadRequestException('只允许上传视频文件!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 1024 * 2, // 2GB limit
      },
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未上传文件');
    }

    const fileUrl = await this.ossService.uploadFile(
      file.buffer,
      file.originalname,
      'watch-party-videos',
    );

    return {
      url: fileUrl,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
