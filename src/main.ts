import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { openBrowser } from './utils/open-browser';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('Demo API')
    .setDescription('Demo API 文档')
    .setVersion('1.0')
    .addTag('users', '用户管理')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const appUrl = `http://localhost:${port}`;
  const swaggerUrl = `${appUrl}/api`;

  console.log(`应用运行在: ${appUrl}`);
  console.log(`Swagger 文档: ${swaggerUrl}`);
}
bootstrap();
