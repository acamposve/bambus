import { Module } from '@nestjs/common';
import { PaymentsModule } from 'src/payments/payments.module';
import { RefundsModule } from 'src/refunds/refunds.module';
import { TotemsModule } from 'src/totems/totems.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { SareaController } from './sarea.controller';

@Module({
  imports: [UsersModule, TransactionsModule, PaymentsModule, RefundsModule, TotemsModule],
  controllers: [SareaController],
})
export class SareaModule {}
