import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private repository: Repository<Tag>) {}

  create(body: Tag) {
    body.createdOn = new Date();

    return this.repository.save(body);
  }

  find(data: any): Promise<Tag> {
    return this.repository.findOne(data);
  }

  findOne(code: string) {
    return this.repository.findOne({ code: code });
  }

  save(body: Tag) {
    return this.repository.save(body);
  }
}
