import { Body, Controller, Get, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { createHash } from 'crypto';
import { OperatorGuard, TotemGuard } from 'src/guards/auth.guard';
import { RollsService } from 'src/rolls/rolls.service';
import { TotemsService } from 'src/totems/totems.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TotemAccessDto } from './dto/access.dto';
import { Totem } from './entities/totem.entity';

@Controller('totem')
export class TotemsController {
  constructor(private totemsService: TotemsService, private rollsService: RollsService, private transactionsService: TransactionsService) {}

  @UseGuards(TotemGuard)
  @Get()
  async me(@Req() req, @Query() query) {
    const totem: Totem = await this.totemsService.findOne(req.totemId);
    const roll = await this.rollsService.findOne(totem.rollId);

    let transaction;
    let nextTag;

    if (!query.summarized) {
      transaction = await this.transactionsService.findOne(totem.lastTransactionId);

      try {
        nextTag = await this.totemsService.getNextTag(totem, false);
      } catch (err) {
        nextTag = null;
      }
    }

    return {
      id: totem.id,
      name: totem.name,
      posTerminalId: query.summarized ? undefined : totem.posTerminalId,
      outOfService: totem.outOfService,
      outOfServiceCause: query.summarized ? undefined : totem.outOfServiceCause,
      outOfServiceOn: query.summarized ? undefined : totem.outOfServiceOn,
      latlng: totem.latlng,
      lastTransaction: transaction
        ? {
            id: transaction.id,
            date: transaction.createdOn,
            status: transaction.status,
          }
        : undefined,
      roll: roll
        ? {
            id: query.summarized ? undefined : roll.id,
            name: query.summarized ? undefined : roll.name,
            qty: roll.qty,
            sequencePosition: roll.sequencePosition,
            nextTagId: nextTag ? nextTag.tag.id : undefined,
            nextTagCode: nextTag ? nextTag.tag.code : undefined,
            nextTagSeq: nextTag ? nextTag.tag.sequencePosition : undefined,
          }
        : null,
    };
  }

  @Post('access')
  @UseGuards(TotemGuard)
  async access(@Req() req, @Body() body: TotemAccessDto) {
    const totem: Totem = await this.totemsService.findOne(req.totemId);
    const isPasswordOk = totem.operatorPassword === createHash('md5').update(body.password).digest('hex');

    if (isPasswordOk) {
      return {
        status: 'OK',
        credentials: totem.operatorPassword,
      };
    }

    throw new UnauthorizedException('Invalid password');
  }

  @Post('status')
  @UseGuards(OperatorGuard)
  async setTotemStatus(@Req() req, @Body() body: { status: number; cause?: 'FAILURE' | 'OUT_OF_TAGS' | 'MANUAL' }) {
    let totem: Totem = await this.totemsService.findOne(req.totemId);

    if (body.status) {
      totem.outOfService = false;
      totem.outOfServiceCause = null;
      totem.outOfServiceOn = null;
    } else {
      totem.outOfService = true;
      totem.outOfServiceCause = body.cause;
      totem.outOfServiceOn = new Date();
    }

    totem = await this.totemsService.save(totem);
    return this.me(req, { summarized: false });
  }

  @Post('settings')
  @UseGuards(OperatorGuard)
  async setTotemSettings(@Req() req, @Body() body: { posTerminalId?: string; latlng?: string }) {
    let totem: Totem = await this.totemsService.findOne(req.totemId);

    if (body.posTerminalId) {
      totem.posTerminalId = body.posTerminalId;
    }

    if (body.latlng) {
      totem.latlng = body.latlng;
    }

    totem = await this.totemsService.save(totem);
    return this.me(req, { summarized: false });
  }
}
