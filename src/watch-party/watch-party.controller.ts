import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

const uploadDir = join(__dirname, '..', '..', 'public', 'uploads');

// Ensure upload directory exists
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('WatchParty')
@Controller('watch-party')
export class WatchPartyController {
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
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
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
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未上传文件');
    }

    // Note: 'public' is served at root
    // In production, you might want to prepend the full domain from config
    const fileUrl = `/uploads/${file.filename}`;

    return {
      url: fileUrl,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
