import { Body, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Document } from 'mongoose';
import { BaseService } from './base.service';

export abstract class BaseController<T extends Document> {
  constructor(private readonly baseService: BaseService<T>) {}

  @Post()
  async create(@Body() createDto: any): Promise<T> {
    return this.baseService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: any): Promise<T[]> {
    return this.baseService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<T> {
    return this.baseService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any): Promise<T> {
    return this.baseService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.baseService.remove(id);
  }
}
