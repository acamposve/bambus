import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(@InjectRepository(Payment) private repository: Repository<Payment>) {}

  create(payment: Payment) {
    return this.repository.save(payment);
  }

  save(payment: Payment) {
    return this.repository.save(payment);
  }

  findOne(id: number): Promise<Payment> {
    return this.repository.findOne(id, { relations: ['transaction', 'refund'] });
  }
}
