import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repository: Repository<User>) {}

  create(body: User) {
    body.updatedOn = new Date();
    body.createdOn = new Date();

    return this.repository.save(body);
  }

  findOne(id: number) {
    return this.repository.findOne(id);
  }

  find(filter: any) {
    return this.repository.findOne(filter);
  }

  save(body: User) {
    body.updatedOn = new Date();
    return this.repository.save(body);
  }
}
