import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsModule } from 'src/tags/tags.module';
import { Totem } from 'src/totems/entities/totem.entity';
import { TotemsService } from 'src/totems/totems.service';
import { Roll } from './entities/roll.entity';
import { RollsController } from './rolls.controller';
import { RollsService } from './rolls.service';

@Module({
  imports: [TypeOrmModule.forFeature([Roll, Totem]), TagsModule],
  providers: [RollsService, TotemsService],
  exports: [RollsService, TypeOrmModule.forFeature([Roll])],
  controllers: [RollsController],
})
export class RollsModule {}
