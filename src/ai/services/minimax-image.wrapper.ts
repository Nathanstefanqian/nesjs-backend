import { Logger } from '@nestjs/common';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

interface MinimaxResponse {
  base_resp: {
    status_code: number;
    status_msg: string;
  };
  results?: Array<{
    base64?: string;
    url?: string;
  }>;
  data?: {
    image_urls?: string[];
  };
}

export class MinimaxImageWrapper extends StructuredTool {
  name = 'minimax_image_generation';
  description = 'Generate images using Minimax API';
  schema = z.object({
    prompt: z.string().describe('The prompt to generate image from'),
    aspect_ratio: z
      .string()
      .optional()
      .describe('The aspect ratio of the image'),
    prompt_optimizer: z.boolean().optional().describe('Optimize prompt'),
    aigc_watermark: z.boolean().optional().describe('Add watermark'),
    seed: z.number().optional().describe('Random seed'),
    reference_image: z
      .string()
      .optional()
      .describe('Reference image URL (Must be a public URL)'),
  });

  private readonly logger = new Logger(MinimaxImageWrapper.name);
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(fields: { apiKey: string; modelName: string }) {
    super();
    this.apiKey = fields.apiKey;
    this.modelName = fields.modelName;
  }

  async _call({
    prompt,
    aspect_ratio,
    prompt_optimizer,
    aigc_watermark,
    seed,
    reference_image,
  }: {
    prompt: string;
    aspect_ratio?: string;
    prompt_optimizer?: boolean;
    aigc_watermark?: boolean;
    seed?: number;
    reference_image?: string;
  }): Promise<string> {
    const url = 'https://api.minimaxi.com/v1/image_generation';

    try {
      this.logger.log(
        `Calling Minimax Image API with prompt: ${prompt.substring(0, 50)}... ratio: ${aspect_ratio}`,
      );

      const body: any = {
        model: this.modelName || 'image-01',
        prompt: prompt,
        aspect_ratio: aspect_ratio,
        prompt_optimizer: prompt_optimizer,
        aigc_watermark: aigc_watermark,
        seed: seed,
        response_format: 'url',
      };

      if (reference_image) {
        body.subject_reference = [
          {
            type: 'character',
            image_file: reference_image,
          },
        ];
      }

      this.logger.log(`Minimax Request Body: ${JSON.stringify(body)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Minimax API HTTP error: ${response.status} ${text}`);
        throw new Error(
          `Minimax API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as MinimaxResponse;

      if (data.base_resp && data.base_resp.status_code !== 0) {
        this.logger.error(`Minimax API logic error: ${JSON.stringify(data)}`);
        throw new Error(
          `Minimax API error: ${data.base_resp.status_msg} (Code: ${data.base_resp.status_code})`,
        );
      }

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result.url) {
          return result.url;
        }
        if (result.base64) {
          return `data:image/png;base64,${result.base64}`;
        }
      }

      if (
        data.data &&
        data.data.image_urls &&
        data.data.image_urls.length > 0
      ) {
        return data.data.image_urls[0];
      }

      this.logger.warn(
        `Unexpected Minimax response format: ${JSON.stringify(data)}`,
      );
      throw new Error('No image data found in Minimax response');
    } catch (error) {
      this.logger.error('Failed to generate image with Minimax', error);
      throw error;
    }
  }
}
