import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { ConfigService } from '@nestjs/config';
import { openBrowser } from './utils/open-browser';
import { setupSwagger } from './config/swagger.config';
import { winstonLogger } from './config/logger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winstonLogger,
  });

  // 配置静态资源服务
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // 允许跨域
  app.enableCors();

  // 配置全局异常过滤器（注意顺序：从具体到通用）
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new MongoExceptionFilter(),
  );

  // 配置全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const configService = app.get(ConfigService);
  setupSwagger(app, {
    autoLoginEmail: configService.get<string>('SWAGGER_AUTO_LOGIN_EMAIL'),
    autoLoginPassword: configService.get<string>('SWAGGER_AUTO_LOGIN_PASSWORD'),
  });
  const port = configService.get<number>('PORT', 3000);
  // Listen on 0.0.0.0 to ensure IPv4 accessibility (fixes ECONNREFUSED on some systems)
  await app.listen(port, '0.0.0.0');

  const appUrl = `http://localhost:${port}`;
  const swaggerUrl = `${appUrl}/api`;

  console.log(`应用运行在: ${appUrl}`);
  console.log(`Swagger 文档: ${swaggerUrl}`);
  console.log(
    `SSE测试地址在 file:///Users/nathanq/sites/fungleo/nestjs-be/public/sse.html`,
  );

  if (process.env.NODE_ENV !== 'production') {
    openBrowser(swaggerUrl);
  }
}
void bootstrap();
