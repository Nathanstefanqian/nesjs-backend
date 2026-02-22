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
}
