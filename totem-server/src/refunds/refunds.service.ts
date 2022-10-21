import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from './entities/refund.entity';

@Injectable()
export class RefundsService {
  constructor(@InjectRepository(Refund) private repository: Repository<Refund>) {}

  create(refund: Refund) {
    return this.repository.save(refund);
  }

  save(refund: Refund) {
    return this.repository.save(refund);
  }

  findOne(id: number): Promise<Refund> {
    return this.repository.findOne(id);
  }
}
