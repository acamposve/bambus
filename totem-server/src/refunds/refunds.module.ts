import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Refund } from './entities/refund.entity';
import { RefundsService } from './refunds.service';

@Module({
  imports: [TypeOrmModule.forFeature([Refund])],
  providers: [RefundsService],
  exports: [RefundsService, TypeOrmModule.forFeature([Refund])],
})
export class RefundsModule {}
