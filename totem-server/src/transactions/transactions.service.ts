import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addYears } from 'date-fns';
import { Between, In, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

// TypeORM Query Operators
export const AfterDate = (date: Date) => Between(date, addYears(date, 100));

@Injectable()
export class TransactionsService {
  constructor(@InjectRepository(Transaction) private repository: Repository<Transaction>) {}

  create(trx: Transaction) {
    trx.createdOn = new Date();
    trx.updatedOn = new Date();

    return this.repository.save(trx);
  }

  findOne(id: number, excludeRelations = false): Promise<Transaction> {
    return this.repository.findOne(id, { relations: excludeRelations ? [] : ['user', 'payments', 'totem', 'theoricTag', 'finalTag'] });
  }

  async getSettlementTransactions(date: string): Promise<Transaction[]> {
    const transactionIds = await this.repository.query(`SELECT id FROM transaction WHERE DATE_FORMAT(createdOn, '%Y-%m-%d') = ? AND status = ?`, [date, 'COMPLETED']);
    return this.repository.find({
      where: {
        id: In(transactionIds.map((i) => i.id)),
      },
      relations: ['user', 'payments', 'totem', 'theoricTag', 'finalTag'],
    });
  }

  save(trx: Transaction) {
    trx.updatedOn = new Date();
    return this.repository.save(trx);
  }
}
