import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import {
  Conversation,
  ConversationDocument,
} from '../../chat/schemas/conversation.schema';
import {
  GeneratedImage,
  GeneratedImageDocument,
} from '../../ai/schemas/generated-image.schema';
import {
  GameRecord,
  GameRecordDocument,
} from '../../game/schemas/game-record.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(GeneratedImage.name)
    private generatedImageModel: Model<GeneratedImageDocument>,
    @InjectModel(GameRecord.name)
    private gameRecordModel: Model<GameRecordDocument>,
  ) {}

  async getUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { data, total, page, limit };
  }

  async updateUserStatus(userId: number, status: string) {
    return this.userModel
      .findOneAndUpdate({ id: userId }, { status }, { new: true })
      .exec();
  }

  async getAiChats(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const query = { type: 'ai' };
    const [data, total] = await Promise.all([
      this.conversationModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .exec(),
      this.conversationModel.countDocuments(query).exec(),
    ]);
    return { data, total, page, limit };
  }

  async getChatMessages(conversationId: string) {
    return this.conversationModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(conversationId) } },
        {
          $lookup: {
            from: 'chatmessages',
            localField: '_id',
            foreignField: 'conversationId',
            as: 'messages',
          },
        },
        { $unwind: { path: '$messages', preserveNullAndEmptyArrays: true } },
        { $sort: { 'messages.createdAt': 1 } },
        {
          $group: {
            _id: '$_id',
            messages: { $push: '$messages' },
          },
        },
      ])
      .exec();
  }

  async getAiImages(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.generatedImageModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.generatedImageModel.countDocuments().exec(),
    ]);
    return { data, total, page, limit };
  }

  async getGameRecords(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.gameRecordModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ endTime: -1 })
        .exec(),
      this.gameRecordModel.countDocuments().exec(),
    ]);
    return { data, total, page, limit };
  }

  async getStats() {
    const [users, chats, images, games] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.conversationModel.countDocuments({ type: 'ai' }).exec(),
      this.generatedImageModel.countDocuments().exec(),
      this.gameRecordModel.countDocuments().exec(),
    ]);
    return { users, chats, images, games };
  }
}
