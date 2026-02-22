import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FriendRequest,
  FriendRequestDocument,
} from './schemas/friend-request.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class FriendService {
  constructor(
    @InjectModel(FriendRequest.name)
    private readonly friendRequestModel: Model<FriendRequestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private buildPairKey(userId: number, targetUserId: number) {
    const [minId, maxId] = [userId, targetUserId].sort((a, b) => a - b);
    return `${minId}:${maxId}`;
  }

  async sendRequest(userId: number, targetUserId: number) {
    if (userId === targetUserId) {
      throw new BadRequestException('不能添加自己为好友');
    }
    const target = await this.userModel.findOne({ id: targetUserId });
    if (!target) {
      throw new NotFoundException('目标用户不存在');
    }
    const pairKey = this.buildPairKey(userId, targetUserId);
    const existing = await this.friendRequestModel.findOne({ pairKey });
    if (!existing) {
      return this.friendRequestModel.create({
        requesterId: userId,
        addresseeId: targetUserId,
        status: 'pending',
        pairKey,
      });
    }
    if (existing.status === 'accepted') {
      return existing;
    }
    if (existing.status === 'pending') {
      if (existing.requesterId !== userId) {
        existing.status = 'accepted';
        await existing.save();
      }
      return existing;
    }
    existing.status = 'pending';
    existing.requesterId = userId;
    existing.addresseeId = targetUserId;
    await existing.save();
    return existing;
  }

  async getRequests(userId: number) {
    const [incoming, outgoing] = await Promise.all([
      this.friendRequestModel.find({
        addresseeId: userId,
        status: 'pending',
      }),
      this.friendRequestModel.find({
        requesterId: userId,
        status: 'pending',
      }),
    ]);
    return { incoming, outgoing };
  }

  async acceptRequest(userId: number, requestId: string) {
    const request = await this.friendRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('好友请求不存在');
    }
    if (request.addresseeId !== userId) {
      throw new BadRequestException('无权处理该请求');
    }
    request.status = 'accepted';
    await request.save();
    return request;
  }

  async rejectRequest(userId: number, requestId: string) {
    const request = await this.friendRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('好友请求不存在');
    }
    if (request.addresseeId !== userId) {
      throw new BadRequestException('无权处理该请求');
    }
    request.status = 'rejected';
    await request.save();
    return request;
  }

  async getFriends(userId: number) {
    const requests = await this.friendRequestModel.find({
      status: 'accepted',
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    });
    const friendIds = requests.map((req) =>
      req.requesterId === userId ? req.addresseeId : req.requesterId,
    );
    if (friendIds.length === 0) {
      return [];
    }
    return this.userModel.find({ id: { $in: friendIds } });
  }

  async isFriends(userId: number, targetUserId: number) {
    const pairKey = this.buildPairKey(userId, targetUserId);
    const existing = await this.friendRequestModel.findOne({
      pairKey,
      status: 'accepted',
    });
    return Boolean(existing);
  }

  async deleteFriend(userId: number, targetUserId: number) {
    const pairKey = this.buildPairKey(userId, targetUserId);
    const existing = await this.friendRequestModel.findOne({
      pairKey,
      status: 'accepted',
    });
    if (!existing) {
      throw new NotFoundException('你们不是好友关系');
    }
    await existing.deleteOne();
    return { success: true };
  }
}
