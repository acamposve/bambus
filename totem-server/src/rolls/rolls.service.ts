import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roll } from './entities/roll.entity';

@Injectable()
export class RollsService {
  constructor(@InjectRepository(Roll) private repository: Repository<Roll>) {}

  create(body: Roll) {
    return this.repository.save(body);
  }

  find(args: any) {
    return this.repository.find(args);
  }

  findOne(id: number) {
    return this.repository.findOne({ id: id }, { relations: [] });
  }

  save(body: Roll) {
    return this.repository.save(body);
  }
}
