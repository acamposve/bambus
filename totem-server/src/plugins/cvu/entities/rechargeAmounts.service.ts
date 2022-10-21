import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RechargeAmounts } from './rechargeAmount.entity';

@Injectable()
export class RechargeAmountsService {
  constructor(@InjectRepository(RechargeAmounts) private repository: Repository<RechargeAmounts>) {}

  findAll() {
    return this.repository.find();
  }
}
