import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';
import { Response } from 'express';

@Catch(MongooseError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '数据库操作失败';

    // 处理不同类型的 MongoDB 错误
    switch (exception.code) {
      case 11000: // 重复键错误
        status = HttpStatus.CONFLICT;
        message = '数据已存在，请检查唯一字段';
        break;
      case 121: // 文档验证失败
        status = HttpStatus.BAD_REQUEST;
        message = '数据验证失败';
        break;
      default:
        this.logger.error('MongoDB错误:', exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
