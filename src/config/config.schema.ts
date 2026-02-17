import Joi, { ObjectSchema } from 'joi';

export const configValidationSchema: ObjectSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DB_TYPE: Joi.string().valid('mongodb', 'postgres').default('mongodb'),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(12),
  JWT_EXPIRES_IN: Joi.string().default('1y'),
  DEEPSEEK_API_KEY: Joi.string().optional(),
  DEEPSEEK_MODEL: Joi.string().default('deepseek-chat'),
  MAX_TOKENS: Joi.number().default(4000),
});
