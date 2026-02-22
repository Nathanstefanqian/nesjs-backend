import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVideoTaskDto {
  @ApiProperty({ example: 'Eason Chan' })
  @IsString()
  @IsNotEmpty()
  artist: string;

  @ApiProperty({ example: 'K Ge Zhi Wang' })
  @IsString()
  @IsNotEmpty()
  song: string;

  @ApiProperty({ example: 'The beginning chorus part' })
  @IsString()
  @IsOptional()
  snippet?: string;

  @ApiProperty({
    example: 'fisheye',
    enum: [
      'fisheye',
      'handheld-indoor',
      'handheld-outdoor',
      'fixed-indoor',
      'other',
    ],
  })
  @IsEnum([
    'fisheye',
    'handheld-indoor',
    'handheld-outdoor',
    'fixed-indoor',
    'other',
  ])
  @IsOptional()
  angle?: string;
}

export class UpdateVideoTaskDto {
  @ApiProperty({ example: 'Eason Chan' })
  @IsString()
  @IsOptional()
  artist?: string;

  @ApiProperty({ example: 'K Ge Zhi Wang' })
  @IsString()
  @IsOptional()
  song?: string;

  @ApiProperty({ example: 'The beginning chorus part' })
  @IsString()
  @IsOptional()
  snippet?: string;

  @ApiProperty({
    example: 'fisheye',
    enum: [
      'fisheye',
      'handheld-indoor',
      'handheld-outdoor',
      'fixed-indoor',
      'other',
    ],
  })
  @IsEnum([
    'fisheye',
    'handheld-indoor',
    'handheld-outdoor',
    'fixed-indoor',
    'other',
  ])
  @IsOptional()
  angle?: string;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'filmed', 'edited', 'completed'],
  })
  @IsEnum(['pending', 'filmed', 'edited', 'completed'])
  @IsOptional()
  status?: string;
}
