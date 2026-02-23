import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { extname } from 'path';

@Injectable()
export class OssService {
  private client: OSS;
  private readonly logger = new Logger(OssService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new OSS({
      region: this.configService.get<string>('ALIYUN_OSS_REGION') || '',
      accessKeyId:
        this.configService.get<string>('ALIYUN_OSS_ACCESS_KEY_ID') || '',
      accessKeySecret:
        this.configService.get<string>('ALIYUN_OSS_ACCESS_KEY_SECRET') || '',
      bucket: this.configService.get<string>('ALIYUN_OSS_BUCKET') || '',
      secure: true, // Use HTTPS
    });
  }

  /**
   * Upload file buffer to OSS
   * @param fileBuffer File content buffer
   * @param originalName Original file name to extract extension
   * @param folder Optional folder path in bucket (e.g., 'uploads')
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    folder: string = 'uploads',
  ): Promise<string> {
    try {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      const extension = extname(originalName);
      const filename = `${folder}/${randomName}${extension}`;

      const result = await this.client.put(filename, fileBuffer);

      // If the bucket is public-read, we can return the URL directly.
      // If secure:true (HTTPS) is set, result.url should be https.
      const url = (result as any).url;
      this.logger.log(`File uploaded to OSS: ${url}`);
      return url as string;
    } catch (error: any) {
      this.logger.error(`OSS upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
