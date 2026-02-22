import { Injectable } from '@nestjs/common';
import { AIModelFactory } from '../ai/services/ai-model.factory';
import { RESUME_QUIZ_PROMPT } from './prompts/resume-quiz.prompts';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

@Injectable()
export class InterviewService {
  constructor(private aiModelFactory: AIModelFactory) {}

  async analyzeResume(resumeContent: string, jobDescription: string) {
    const model = this.aiModelFactory.createDeepSeekModel(0.3);
    const prompt = PromptTemplate.fromTemplate(RESUME_QUIZ_PROMPT);
    const parser = new JsonOutputParser();
    const chain = RunnableSequence.from([prompt, model, parser]);
    const result = await chain.invoke({
      resume_content: resumeContent,
      job_description: jobDescription,
    });

    return result;
  }
}
