import { Body, Controller, Get, HttpException, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OperatorGuard } from 'src/guards/auth.guard';
import { RollsService } from 'src/rolls/rolls.service';
import { TotemsService } from 'src/totems/totems.service';
import { Like } from 'typeorm';
import { AssignRollDto } from './dto/assignRoll.dto';

@Controller('rolls')
@UseGuards(OperatorGuard)
export class RollsController {
  constructor(private totemsService: TotemsService, private rollsService: RollsService) {}

  @Get('filter')
  async getRolls(@Query('name') name) {
    return this.rollsService.find({
      name: Like(`${name}%`),
      status: 'FREE',
    });
  }

  @Post('assign')
  async assingRoll(@Req() req, @Body() data: AssignRollDto) {
    let totem = await this.totemsService.findOne(req.totemId);

    let existingRoll = await this.rollsService.findOne(totem.rollId);
    let newRoll = await this.rollsService.findOne(data.rollId);

    if (!newRoll) {
      throw new HttpException({ message: 'No se encuentra el rollo especificado' }, 404);
    }

    if (newRoll.status != 'FREE') {
      throw new HttpException({ message: 'El rollo especificado no esta listo para ser usado' }, 400);
    }

    existingRoll.status = 'REMOVED';
    newRoll.status = 'INSTALLED';

    totem.rollId = newRoll.id;

    totem = await this.totemsService.save(totem);
    existingRoll = await this.rollsService.save(existingRoll);
    newRoll = await this.rollsService.save(newRoll);

    return {
      totem: req.totemId,
      newRoll: newRoll.id,
      prevRoll: existingRoll.id,
    };
  }
}
