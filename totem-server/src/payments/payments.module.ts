import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TotemsModule } from 'src/totems/totems.module';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), TotemsModule],
  providers: [PaymentsService],
  exports: [PaymentsService, TypeOrmModule.forFeature([Payment])],
})
export class PaymentsModule {}
