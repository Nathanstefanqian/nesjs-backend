import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatDeepSeek } from '@langchain/deepseek';
import { DallEAPIWrapper } from '@langchain/openai';

@Injectable()
export class AIModelFactory {
  constructor(private configService: ConfigService) {}

  createDeepSeekModel(
    temperature = 0.7,
    modelName = 'deepseek-chat',
  ): ChatDeepSeek {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not found in environment variables');
    }

    return new ChatDeepSeek({
      apiKey,
      modelName,
      temperature,
    });
  }

  createDallEWrapper(modelName = 'dall-e-3'): DallEAPIWrapper {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    return new DallEAPIWrapper({
      n: 1,
      modelName,
      apiKey,
    });
  }
}
