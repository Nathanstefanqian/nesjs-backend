import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoTask, VideoTaskDocument } from './schemas/video-task.schema';
import { CreateVideoTaskDto, UpdateVideoTaskDto } from './dto/video-task.dto';
import { AIModelFactory } from '../ai/services/ai-model.factory';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class VideoTaskService {
  constructor(
    @InjectModel(VideoTask.name)
    private readonly videoTaskModel: Model<VideoTaskDocument>,
    private readonly aiModelFactory: AIModelFactory,
  ) {}

  async create(userId: number, createVideoTaskDto: CreateVideoTaskDto) {
    const task = new this.videoTaskModel({
      ...createVideoTaskDto,
      userId,
    });
    return task.save();
  }

  async findAll(userId: number) {
    return this.videoTaskModel.find({ userId }).sort({ createdAt: -1 });
  }

  async findOne(id: string, userId: number) {
    const task = await this.videoTaskModel.findOne({ _id: id, userId });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(
    id: string,
    userId: number,
    updateVideoTaskDto: UpdateVideoTaskDto,
  ) {
    const task = await this.videoTaskModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateVideoTaskDto },
      { new: true },
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async remove(id: string, userId: number) {
    const task = await this.videoTaskModel.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async removeMany(
    ids: string[],
    userId: number,
  ): Promise<{ deletedCount: number }> {
    const result = await this.videoTaskModel.deleteMany({
      _id: { $in: ids },
      userId,
    });
    return { deletedCount: result.deletedCount };
  }

  async removeAll(userId: number): Promise<{ deletedCount: number }> {
    const result = await this.videoTaskModel.deleteMany({ userId });
    return { deletedCount: result.deletedCount };
  }

  async generateAuto(userId: number) {
    const model = this.aiModelFactory.createDeepSeekModel(0.7);
    const parser = new JsonOutputParser();

    const prompt = PromptTemplate.fromTemplate(
      `Generate a list of 25 music video tasks.
      Requirements:
      1. Select 5 popular music artists (can be Chinese or International).
      2. For each artist, select 5 of their most popular songs.
      3. For each song, assign a random filming angle from this list: 'fisheye', 'handheld-indoor', 'handheld-outdoor', 'fixed-indoor', 'other'.
      4. Provide a short snippet of lyrics for each song (in original language) as 'snippet'.
      5. Output must be a JSON array of objects with fields: artist, song, snippet, angle.
      
      {format_instructions}
      `,
    );

    const chain = prompt.pipe(model).pipe(parser);

    try {
      const result: any = await chain.invoke({
        format_instructions: parser.getFormatInstructions(),
      });

      // Validate result structure roughly
      if (!Array.isArray(result)) {
        throw new Error('AI output is not an array');
      }

      const tasksToCreate = result.map((item: any) => ({
        userId,
        artist: item.artist,
        song: item.song,
        snippet: item.snippet,
        angle: item.angle || 'other',
        status: 'pending',
      }));

      return await this.videoTaskModel.insertMany(tasksToCreate);
    } catch (error) {
      console.error('AI generation failed:', error);
      throw new Error('Failed to generate tasks via AI');
    }
  }
}
