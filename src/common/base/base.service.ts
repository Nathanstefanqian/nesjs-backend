import { Injectable, NotFoundException } from '@nestjs/common';
import { Model, Document } from 'mongoose';

@Injectable()
export abstract class BaseService<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(createDto: any): Promise<T> {
    const createdEntity = new this.model(createDto);
    return createdEntity.save();
  }

  async findAll(filter: any = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.model.findById(id).exec();
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: any): Promise<T> {
    const updatedEntity = await this.model
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!updatedEntity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return updatedEntity;
  }

  async remove(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
  }
}
