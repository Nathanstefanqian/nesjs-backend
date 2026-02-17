import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('Demo API')
    .setDescription('Demo API 文档')
    .setVersion('1.0')
    .addTag('auth', '认证授权')
    .addTag('users', '用户管理')
    .addTag('interviews', '面试管理')
    .addTag('test', '测试接口')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const appUrl = `http://localhost:${port}`;
  const swaggerUrl = `${appUrl}/api`;

  console.log(`应用运行在: ${appUrl}`);
  console.log(`Swagger 文档: ${swaggerUrl}`);
  console.log(
    `SSE测试地址在 file:///Users/nathanq/sites/fungleo/nestjs-be/public/sse.html`,
  );
}
void bootstrap();
