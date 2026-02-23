import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateImageDto {
  @ApiProperty({ description: '图片生成提示词', example: 'A futuristic city' })
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @ApiProperty({
    description: '模型名称',
    example: 'dall-e-3',
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    description: '图片比例',
    example: '1:1',
    required: false,
  })
  @IsOptional()
  @IsString()
  aspect_ratio?: string;

  @ApiProperty({
    description: '是否优化提示词',
    example: false,
    required: false,
  })
  @IsOptional()
  prompt_optimizer?: boolean;

  @ApiProperty({
    description: '是否添加水印',
    example: false,
    required: false,
  })
  @IsOptional()
  aigc_watermark?: boolean;

  @ApiProperty({
    description: '随机种子',
    example: 123456,
    required: false,
  })
  @IsOptional()
  seed?: number;

  @ApiProperty({
    description: '参考图 URL (用于图生图)',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference_image?: string;
}
