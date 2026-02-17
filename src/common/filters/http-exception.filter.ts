import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 构建错误响应
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || '请求失败',
      error:
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).error
          : undefined,
    };

    // 记录日志
    this.logger.warn(
      `HTTP异常: ${request.method} ${request.url} - Status: ${status} - Message: ${errorResponse.message}`,
    );

    response.status(status).json(errorResponse);
  }
}
