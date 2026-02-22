import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from '../common/base/base.service';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostService extends BaseService<PostDocument> {
  constructor(@InjectModel(Post.name) postModel: Model<PostDocument>) {
    super(postModel);
  }
}
