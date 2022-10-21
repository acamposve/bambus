import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RollsModule } from 'src/rolls/rolls.module';
import { TagsModule } from 'src/tags/tags.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { Totem } from './entities/totem.entity';
import { TotemsController } from './totems.controller';
import { TotemsService } from './totems.service';

@Module({
  imports: [TypeOrmModule.forFeature([Totem]), TagsModule, RollsModule, TransactionsModule],
  providers: [TotemsService],
  exports: [TotemsService, TypeOrmModule.forFeature([Totem])],
  controllers: [TotemsController],
})
export class TotemsModule {}
