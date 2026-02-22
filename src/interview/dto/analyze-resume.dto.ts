import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeResumeDto {
  @ApiProperty({
    description: '简历内容',
    example: '姓名: 张三\n工作年限: 5年\n技能: Java, Spring Boot',
  })
  @IsString()
  @IsNotEmpty()
  resume_content: string;

  @ApiProperty({
    description: '岗位要求',
    example: '岗位: Java 后端\n要求: Spring Boot, Redis',
  })
  @IsString()
  @IsNotEmpty()
  job_description: string;
}
