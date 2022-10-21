import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter } from 'events';
import { PaymentsModule } from 'src/payments/payments.module';
import { RollsModule } from 'src/rolls/rolls.module';
import { TagsModule } from 'src/tags/tags.module';
import { TotemsModule } from 'src/totems/totems.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { CvuController } from './cvu.controller';
import CvuHandler from './cvu.handler';
import { RechargeAmounts } from './entities/rechargeAmount.entity';
import { RechargeAmountsService } from './entities/rechargeAmounts.service';

const CvuEvents = new EventEmitter();
@Module({
  imports: [PaymentsModule, UsersModule, TransactionsModule, TagsModule, TypeOrmModule.forFeature([RechargeAmounts]), CvuHandler, TotemsModule, RollsModule],
  providers: [RechargeAmountsService],
  controllers: [CvuController],
  exports: [RechargeAmountsService],
})
export class CvuModule {}
export { CvuEvents };
