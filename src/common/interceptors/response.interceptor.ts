import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // 获取东八区时间
        const timestamp = new Date().toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        // 处理空数据
        if (data === null || data === undefined) {
          return {
            code: HttpStatus.OK,
            message: '操作成功, 数据为空',
            data: null,
            timestamp,
            path: request.url,
          };
        }

        // 处理已经是标准格式的数据
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'message' in data
        ) {
          return {
            ...data,
            timestamp,
            path: request.url,
          };
        }

        // 标准成功响应格式
        return {
          code: HttpStatus.OK,
          message: '操作成功',
          data: data,
          timestamp,
          path: request.url,
        };
      }),
    );
  }
}

