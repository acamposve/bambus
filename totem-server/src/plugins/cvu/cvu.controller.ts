import { Body, Controller, Get, HttpException, Post, Query, Req, Request, UseGuards } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import { config } from 'src/app.config';
import { AuthGuard, OperatorGuard } from 'src/guards/auth.guard';
import { PaymentsService } from 'src/payments/payments.service';
import { RollsService } from 'src/rolls/rolls.service';
import { TagsService } from 'src/tags/tags.service';
import { Totem } from 'src/totems/entities/totem.entity';
import { TotemsService } from 'src/totems/totems.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { reportError, reportInfo, reportSimple, reportWarn } from 'src/utils';
import { CVU } from './cvu.connector';
import { CvuEvents } from './cvu.module';
import { CvuBrandModelsDto } from './dto/brandModels.dto';
import { CvuCheckTagDto } from './dto/checkTag.dto';
import { CvuConfirmDto } from './dto/confirm.dto';
import { CvuConfirmRechargeDto } from './dto/confirmRecharge.dto';
import { CvuExecuteRollbackDto } from './dto/executeRollback.dto';
import { CvuExecuteStartDto } from './dto/executeStart.dto';
import { CvuExecuteStatusDto } from './dto/executeStatus.dto';
import { CvuExpendedTagDto } from './dto/expendedTag.dto';
import { ExtendedTagManualDto } from './dto/expendedTagManual.dto';
import { CvuReverseChargeDto } from './dto/reverseCharge.dto';
import { CvuStartNewDto } from './dto/startNew.dto';
import { CvuStartRechargeDto } from './dto/startRecharge.dto';
import { RechargeAmountsService } from './entities/rechargeAmounts.service';

const winston = require('winston');
const ngage = require('../ngage');
const moment = require('moment');

@Controller('cvu')
export class CvuController {
  constructor(
    private rechargeAmountsService: RechargeAmountsService,
    private paymentsService: PaymentsService,
    private userService: UsersService,
    private transactionService: TransactionsService,
    private tagsService: TagsService,
    private totemsService: TotemsService,
    private rollsService: RollsService,
  ) {}

  @Post('start/new')
  @UseGuards(AuthGuard)
  async start(@Body() body: CvuStartNewDto, @Request() req) {
    let localTransaction = new Transaction();
    localTransaction.totemId = req.totemId;
    localTransaction = await this.transactionService.create(localTransaction);

    const totem = await this.totemsService.findOne(req.totemId);
    const theoricTag = await this.totemsService.getNextTag(totem);

    const cvuAnswer = await CVU.WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdCliente({
      docType: body.userDocType,
      docValue: body.userDocValue,
      vehiclePlateNumber: body.vehiclePlateNumber,
      transaction: localTransaction,
    });

    if (cvuAnswer['AuxIdOperacion'] == -1) {
      return {
        operation: null,
        error: cvuAnswer['AuxObservacion'],
      };
    }

    const transactionType: any = ['NEW_CLIENT', 'ADD_VEHICLE', 'ASSIGN_TAG'][cvuAnswer['AuxIdOperacion'] - 1];
    localTransaction.status = 'PLACEHOLDER';
    localTransaction.type = transactionType;
    localTransaction.theoricTagId = theoricTag.tag.id;

    let user;
    const existingUser = await this.userService.find({ docType: body.userDocType, doc: body.userDocValue });
    if (existingUser) {
      user = existingUser;
    } else {
      user = new User();
    }

    user.docType = body.userDocType;
    user.doc = body.userDocValue;

    if (cvuAnswer['AuxNombre']) user.name = cvuAnswer['AuxNombre'];
    if (cvuAnswer['AuxEmail']) user.email = cvuAnswer['AuxEmail'];
    if (cvuAnswer['AuxTelefonoCelular']) user.cellphone = cvuAnswer['AuxTelefonoCelular'].toString();
    if (cvuAnswer['AuxIdCliente']) user.externalId = cvuAnswer['AuxIdCliente'];

    const dbUser = await this.userService.create(user);
    localTransaction.user = dbUser;

    localTransaction = await this.transactionService.save(localTransaction);

    return {
      operation: ['NEW_CLIENT', 'ADD_VEHICLE', 'ASSIGN_TAG'][cvuAnswer['AuxIdOperacion'] - 1],
      userName: cvuAnswer['AuxNombre'],
      userEmail: cvuAnswer['AuxEmail'],
      userCel: cvuAnswer['AuxTelefonoCelular'],
      error: null,
      tagValue: cvuAnswer['AuxValTag'],
      nroCliente: cvuAnswer['AuxIdCliente'],
      transactionId: localTransaction.id,
      tagId: theoricTag.tag.id,
      tagCode: theoricTag.tag.code,
      printQty: theoricTag.printQty,
    };
  }

  @Post('start/recharge')
  @UseGuards(AuthGuard)
  async recharge(@Body() body: CvuStartRechargeDto, @Request() req) {
    const localTransaction = new Transaction();
    localTransaction.totemId = req.totemId;

    localTransaction.type = 'RECHARGE';
    localTransaction.status = 'PLACEHOLDER';

    let user;
    const existingUser = await this.userService.find({ docType: body.userDocType, doc: body.userDocValue });
    if (existingUser) {
      user = existingUser;
    } else {
      user = new User();
    }

    localTransaction.user = user;

    const transaction = await this.transactionService.create(localTransaction);

    winston.info('CVUController | recharge | Checking account for docType:%s,  docValue:%s, trx:%s...', body.userDocType, body.userDocValue, transaction);

    let cvuAnswer;
    try {
      cvuAnswer = await CVU.ConsultarCuenta({
        docType: body.userDocType,
        docValue: body.userDocValue,
        transaction: transaction,
      });
    } catch (exc) {
      winston.error('CVUController | recharge | Error on CVU.ConsultarCuenta.');
      winston.error(exc);
      throw new HttpException(exc.toString(), 500);
    }

    /*
    <?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><ConsultarCuentaResponse xmlns="http://tempuri.org/"><ConsultarCuentaResult>false</ConsultarCuentaResult><xsCuentaHabilitada /><xiNroCliente>0</xiNroCliente><xsNombreCliente /><xdSaldo>0</xdSaldo><xsObservacion>Error en la ejecución del WS. (Ref.:AU_UA)</xsObservacion><xdImporteMin>0</xdImporteMin><xdImporteMax>0</xdImporteMax><xiTiempoMaxParaReversar>0</xiTiempoMaxParaReversar></ConsultarCuentaResponse></soap:Body></soap:Envelope> 
*/

    return {
      exists: cvuAnswer['xsCuentaHabilitada'],
      nroCliente: cvuAnswer['xiNroCliente'],
      observacion: cvuAnswer['xsObservacion'],
      transactionId: transaction.id,
    };
  }

  @Get('vehicle/brands')
  @UseGuards(AuthGuard)
  async vehiclesBrand() {
    const cvuResponse = await CVU.WS_MarcaSelAll();

    const brands = cvuResponse
      .split('@')
      .map((brand) => {
        return {
          id: brand.split('#')[0],
          name: brand.split('#')[1],
        };
      })
      .filter((i) => i.id);

    return brands;
  }

  @Get('vehicle/models')
  @UseGuards(AuthGuard)
  async brandModels(@Query() body: CvuBrandModelsDto) {
    const cvuResponse = await CVU.WS_ModeloSelXMarca(body.brand);

    const models = cvuResponse
      .split('@')
      .map((model) => {
        return {
          id: model.split('#')[0],
          name: model.split('#')[1],
        };
      })
      .filter((i) => i.id);

    return models;
  }

  @Get('vehicle/colors')
  @UseGuards(AuthGuard)
  async brandColors() {
    const cvuResponse = await CVU.WS_ColorSelAll();

    const colors = cvuResponse
      .split('@')
      .map((color) => {
        return {
          id: color.split('#')[0],
          name: color.split('#')[1],
        };
      })
      .filter((i) => i.id);

    return colors;
  }

  @Get('rechargeAmounts')
  @UseGuards(AuthGuard)
  async rechargeAmounts() {
    return this.rechargeAmountsService.findAll();
  }

  @Post('executeStart')
  @UseGuards(AuthGuard)
  async executeStart(@Body() body: CvuExecuteStartDto) {
    let transaction: Transaction = await this.transactionService.findOne(body.transactionId);
    if (!transaction) {
      throw new HttpException('Transaction not found', 400);
    }

    transaction.status = 'PROCESSING';

    if (body.clientNumber) transaction.user.externalId = body.clientNumber.toString();
    if (body.user?.docType) transaction.user.docType = body.user.docType;
    if (body.user?.docValue) transaction.user.doc = body.user.docValue;
    if (body.user?.name) transaction.user.name = body.user.name;
    if (body.user?.email) transaction.user.email = body.user.email;
    if (body.user?.cel) transaction.user.cellphone = body.user.cel;

    transaction.amount = body.amount.amount;
    transaction = await this.transactionService.save(transaction);

    CvuEvents.emit('executeStart', transaction, body.vehicle);

    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      userId: transaction.userId,
      errorCode: transaction.errorCode,
      errorDesc: transaction.errorDesc,
      amount: transaction.amount,
      payments: transaction.payments.map((payment) => {
        return {
          id: payment.id,
          amount: payment.amount,
          amountDiscount: payment.amountDiscount,
          status: payment.status,
        };
      }),
    };
  }

  @Post('executeStatus')
  @UseGuards(AuthGuard)
  async executeStatus(@Body() body: CvuExecuteStatusDto) {
    const transaction: Transaction = await this.transactionService.findOne(body.transactionId);
    if (!transaction) {
      throw new HttpException('Transaction not found', 400);
    }

    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      userId: transaction.userId,
      errorCode: transaction.errorCode,
      errorDesc: transaction.errorDesc,
      amount: transaction.amount,
      payments: transaction.payments.map((payment) => {
        return {
          id: payment.id,
          amount: payment.amount,
          amountDiscount: payment.amountDiscount,
          status: payment.status,
        };
      }),
    };
  }

  @Post('checkTag')
  @UseGuards(AuthGuard)
  async checkTag(@Body() data: CvuCheckTagDto, @Request() req) {
    const totem = await this.totemsService.findOne(req.totemId);
    const transaction = await this.transactionService.findOne(data.transactionId);

    let roll = await this.rollsService.findOne(totem.rollId);
    let newTransaction;

    const tagFromRequest = await this.tagsService.find({ code: data.tagCode, rollId: roll });
    if (!tagFromRequest) {
      winston.debug("checkTag | request: %s | Tag from request doesn't exist on database.", data.tagCode);
      throw new HttpException('Tag not found on database.', 404);
    }

    if (tagFromRequest.status == 'INVALID') {
      winston.debug('checkTag | Tag from request is invalid.');
      throw new HttpException('Tag is invalid.', 400);
    }

    if (tagFromRequest.status != 'FREE') {
      winston.debug('checkTag | Tag from request is not free.');
      throw new HttpException('Tag is not free.', 400);
    }

    const tagOnTransaction = await this.tagsService.find({ id: transaction.theoricTagId });

    winston.debug('checkTag | request: %s | transaction: %s', data.tagCode, tagOnTransaction.code);
    if (tagFromRequest.id == tagOnTransaction.id) {
      winston.info('checkTag | Tag matches. No need to move. Updating real tag to this one.');

      newTransaction = await this.transactionService.findOne(data.transactionId, true);
      newTransaction.finalTagId = transaction.theoricTagId;

      await this.transactionService.save(newTransaction);

      return {
        tagId: tagOnTransaction.id,
        createdOn: tagOnTransaction.createdOn,
        status: tagOnTransaction.status,
        autoFixed: false,
      };
    }

    winston.debug('checkTag | Tag do not match. Moving');

    winston.debug('checkTag | Prev roll position: %s', tagOnTransaction.sequence);
    winston.debug('checkTag | New roll position: %s', tagFromRequest.sequence);

    roll = await this.rollsService.findOne(tagFromRequest.rollId);
    roll.sequencePosition = tagFromRequest.sequence;

    winston.debug('checkTag | Prev theoric tag id: %s', tagOnTransaction.id);
    winston.debug('checkTag | New finalTagId: %s', tagFromRequest.id);

    newTransaction = await this.transactionService.findOne(data.transactionId, true);
    newTransaction.finalTagId = tagFromRequest.id;
    await this.transactionService.save(newTransaction);

    return {
      tagId: tagFromRequest.code,
      createdOn: tagFromRequest.createdOn,
      status: tagFromRequest.status,
      autoFixed: true,
    };
  }

  @Post('reverseRecharge')
  @UseGuards(AuthGuard)
  async reverseRecharge(@Body() body: CvuReverseChargeDto) {
    let transaction = await this.transactionService.findOne(body.transactionId);

    const cvuAnswer = await CVU.ReversarRecargaCuenta(transaction, transaction.finalTag || transaction.theoricTag);
    winston.debug('CvuHandler | reverseRecharge | transaction %s', transaction.id);

    console.log(cvuAnswer);
    if (!cvuAnswer['ReversarRecargaCuentaResult']) {
      transaction.status = 'ERROR_REVERSED';
      transaction.errorCode = 'error reversing';
      transaction.errorDesc = cvuAnswer['xsObservacion'];
      winston.error('CvuHandler | reverseRecharge | Error for transaction %s\n%o', transaction.id, cvuAnswer);
      reportError({
        title: 'reverseRecharge | Error.',
        stack: cvuAnswer,
      });
      transaction = await this.transactionService.save(transaction);
      return {
        id: transaction.id,
        status: transaction.status,
        errorCode: transaction.errorCode,
        errorDesc: transaction.errorDesc,
      };
    }

    transaction.status = 'REVERSED';
    transaction.errorCode = '';
    transaction.errorDesc = '';

    winston.debug('CvuHandler | reverseRecharge | Success for transaction %s', transaction.id);
    transaction = await this.transactionService.save(transaction);
    return {
      id: transaction.id,
      status: transaction.status,
      errorCode: transaction.errorCode,
      errorDesc: transaction.errorDesc,
    };
  }

  @Post('expendedTag')
  @UseGuards(AuthGuard)
  async expendedTag(@Body() body: CvuExpendedTagDto) {
    const transaction = await this.transactionService.findOne(body.transactionId);
    if (!transaction) {
      throw new HttpException('Transaction not found', 400);
    }

    const tag = await this.tagsService.find({ id: transaction.theoricTagId });
    if (!tag) {
      throw new HttpException('Tag not found', 404);
    }

    let roll = await this.rollsService.findOne(tag.rollId);
    if (!roll) {
      throw new HttpException('Roll not found', 404);
    }

    const totem: Totem = await this.totemsService.findOneWhere({ rollId: roll.id });
    const origSequencePosition = roll.sequencePosition;

    roll.sequencePosition += body.printQty;
    roll = await this.rollsService.save(roll);

    for (const threshold of config.alerts.threshold.email) {
      if (threshold == roll.qty - roll.sequencePosition) {
        const stack = {
          id: roll.id,
          sequencePosition: roll.sequencePosition,
          qty: roll.qty,
          name: roll.name,
          lastTagUsedOn: roll.lastTagUsedOn,
          totem: {
            id: totem.id,
            name: totem.name,
          },
        };

        reportWarn({
          title: `[${totem.name}] Quedan pocos tags. (${roll.qty - roll.sequencePosition})`,
          stack: stack,
        });

        ngage.send({
          to: config.alerts.email,
          source: config.ngage.from,
          subject: `[${totem.name}] Quedan pocos tags. (${roll.qty - roll.sequencePosition})`,
          body: JSON.stringify(stack),
          type: 'PRIVATE',
        });
      }
    }

    return {
      status: 'OK',
      prevRollPosition: origSequencePosition,
      newRollPosition: roll.sequencePosition,
      tagSequence: tag.sequence,
    };
  }

  @Post('expendedTagManual')
  @UseGuards(OperatorGuard)
  async expendedTagManual(@Req() req, @Body() body: ExtendedTagManualDto) {
    const totem = await this.totemsService.findOne(req.totemId);
    let roll = await this.rollsService.findOne(totem.rollId);
    const tag = await this.tagsService.find({ code: body.tagCode, rollId: totem.rollId });

    if (!tag) {
      winston.error('CVU | expendedTagManual | Tag not found.');
      throw new HttpException({ msg: 'Tag not found' }, 404);
    }

    winston.info('CVU | expendedTagManual | Moved to tag %s, seq: %s', tag.code, tag.sequence);

    roll.sequencePosition = tag.sequence;
    roll = await this.rollsService.save(roll);

    return {
      expendedTagSequence: tag.sequence,
      expendedTagCode: tag.code,
    };
  }

  @Post('confirm')
  @UseGuards(AuthGuard)
  async confirm(@Body() body: CvuConfirmDto) {
    winston.debug('CVU | confirm | transactionId: %s', body.transactionId);

    let transaction = await this.transactionService.findOne(body.transactionId);
    if (!transaction) {
      throw new HttpException('Transaction not found', 400);
    }

    winston.debug('CVU | confirm | About to confirm recharge');
    transaction = await this.confirmRecharge({
      transactionId: transaction.id,
    });

    if (transaction.status == 'ERROR') {
      winston.error('CVU | confirm | Error on confirm for transaction %s', transaction.id);
      throw new HttpException({ msg: 'Error on confirm transaction', desc: transaction.errorDesc }, 400);
    }

    winston.info('CVU | confirm | Success on recharge confirm');

    transaction.status = 'COMPLETED';

    let tag = await this.tagsService.find({ id: transaction.finalTagId });
    tag.status = 'ASSIGNED';
    tag.assignedToId = transaction.userId;
    tag = await this.tagsService.save(tag);

    let roll = await this.rollsService.findOne(tag.rollId);
    roll.sequencePosition = tag.sequence;
    roll = await this.rollsService.save(roll);

    delete transaction.totem;
    delete transaction.theoricTag;
    delete transaction.finalTag;
    delete transaction.user;

    winston.debug('CvuHandler | confirm | Success for transaction %s with tag: %s', transaction.id, tag.id);
    transaction = await this.transactionService.save(transaction);
    return transaction;
  }

  @Post('confirmRecharge')
  @UseGuards(AuthGuard)
  async confirmRecharge(@Body() body: CvuConfirmRechargeDto) {
    winston.debug('CVU | confirmRecharge | transactionId: %s', body.transactionId);
    let transaction: Transaction = await this.transactionService.findOne(body.transactionId);
    if (!transaction) {
      throw new HttpException('Transaction not found', 400);
    }

    let cvuAnswer;
    if (['NEW_CLIENT', 'ADD_VEHICLE', 'ASSIGN_TAG'].includes(transaction.type)) {
      winston.info('CvuHandler | confirmRecharge | About to ConfirmOperation.');
      const opResp = await CVU.WS_ConfOper(transaction);
      transaction.opExternalId = opResp.ref;

      cvuAnswer = opResp.response;
      if (cvuAnswer['WS_ConfOperResult'] != '0') {
        transaction.status = 'ERROR';
        transaction.errorCode = 'error';
        transaction.errorDesc = cvuAnswer['AuxDescrErr'];
        winston.error('CvuHandler | confirmRecharge | ERROR: CONFIRMING THE OPERATION. | Error for transaction %o, %o', transaction.id, cvuAnswer);
        await this.transactionService.save(transaction);
        return transaction;
      }
      winston.info('CvuHandler | confirmRecharge | confirmOperation: Success.');
    }

    const rcResp = await CVU.ConfirmarRecarga(transaction, transaction.theoricTag || transaction.finalTag);
    transaction.rcExternalId = rcResp.ref;

    cvuAnswer = rcResp.response;
    if (cvuAnswer['OP_ConfirmarRecargaResult'] != '0') {
      transaction.status = 'ERROR';
      transaction.errorCode = 'error';
      transaction.errorDesc = cvuAnswer['AuxDescrErr'];
      winston.error('CvuHandler | confirmRecharge | ERROR: CONFIRMING THE RECHARGE. | Error for transaction %o, %o', transaction.id, cvuAnswer);
      await this.transactionService.save(transaction);
      return transaction;
    }

    winston.info('CVU | confirmRecharge | Successs for transactionId: %s', body.transactionId);
    transaction.status = 'COMPLETED';
    transaction.errorCode = null;

    transaction = await this.transactionService.save(transaction);
    return transaction;
  }

  @Post('executeRollback')
  @UseGuards(AuthGuard)
  async executeRollback(@Body() body: CvuExecuteRollbackDto) {
    winston.debug('CVU | executeRollback | transactionId: %s', body.transactionId);

    let transaction = await this.transactionService.findOne(body.transactionId);
    if (!transaction) {
      throw new HttpException('Transaction not found', 400);
    }

    const tag = await this.tagsService.find({ id: transaction.finalTagId || transaction.theoricTagId });

    let cvuAnswer;
    switch (transaction.type) {
      case 'ADD_VEHICLE':
        winston.debug('CvuHandler | executeRollback | ADD_VEHICLE needs to be reversed');
        cvuAnswer = await CVU.WS_AddVehiculoDel(transaction, tag);

        if (cvuAnswer['WS_AddVehiculoDelResult'] != '0') {
          transaction.status = 'ERROR_CANCELED';
          transaction.errorCode = 'error';
          transaction.errorDesc = cvuAnswer['AuxObservacion'];
          winston.error('CvuHandler | executeRollback | ERROR: Rollback ADD_VEHICLE | Error for transaction %o, %o', transaction.id, cvuAnswer);
          transaction = await this.transactionService.save(transaction);
          return transaction;
        }
        break;
      case 'ASSIGN_TAG':
        winston.debug('CvuHandler | executeRollback | ASSIGN_TAG needs to be reversed');
        cvuAnswer = await CVU.WS_AsigTagDel(transaction, tag);

        if (cvuAnswer['WS_AsigTagDelResult'] != '0') {
          transaction.status = 'ERROR_CANCELED';
          transaction.errorCode = 'error';
          winston.error('CvuHandler | executeRollback | ERROR: Rollback ASSIGN_TAG | Error for transaction %o, %o', transaction.id, cvuAnswer);
          transaction = await this.transactionService.save(transaction);
          return transaction;
        }
        break;
      case 'NEW_CLIENT':
        winston.debug('CvuHandler | executeRollback | NEW_CLIENT needs to be reversed');
        cvuAnswer = await CVU.WS_CliDelPrep(transaction, tag);

        if (cvuAnswer['WS_CliDelPrepResult'] != '0') {
          transaction.status = 'ERROR_CANCELED';
          transaction.errorCode = 'error';
          winston.error('CvuHandler | executeRollback | ERROR: Rollback NEW_CLIENT | Error for transaction %o, %o', transaction.id, cvuAnswer);
          transaction = await this.transactionService.save(transaction);
          return transaction;
        }
        break;
    }

    winston.info('CvuHandler | executeRollback | %s reversed.', transaction.type);

    transaction.status = 'CANCELED';
    transaction.errorCode = '';
    transaction.errorDesc = '';

    transaction.totem.lastTransactionId = transaction.id;
    await this.totemsService.save(transaction.totem);

    // if (body.rollbackSequence) {
    //   tag.status = 'FREE';
    //   tag.assignedToId = null;

    //   tag = await this.tagsService.save(tag);

    //   var roll = await this.rollsService.findOne(tag.rollId);
    //   roll.sequencePosition = tag.sequence - 1;
    //   roll = await this.rollsService.save(roll);
    // }

    delete transaction.totem;
    delete transaction.theoricTag;
    delete transaction.finalTag;
    delete transaction.user;

    transaction = await this.transactionService.save(transaction);
    winston.debug('CvuHandler | executeRollback | %s | Success for transaction %s with new tag: %s', transaction.type, transaction.id, tag ? tag.id : 'null');
    return transaction;
  }

  @Cron('0 12 * * *')
  @Get('generateSettlement')
  async generateSettlement(@Query('date') date, @Query('debug') debug) {
    if (!date) {
      date = new Date();
      date.setDate(date.getDate() - 1);
      date = moment(date).format('YYYY-MM-DD');
    }

    const transactions = await this.transactionService.getSettlementTransactions(date);
    if (!transactions.length) {
      winston.debug('CvuHandler | generateSettlements | No transactions to report for date %s', date);
      return { msg: 'OK' };
    }
    const result = [];
    for (const transaction of transactions) {
      result.push([transaction.user.externalId, moment(transaction.createdOn).utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'), transaction.amount, transaction.totemId, transaction.totemId, transaction.rcExternalId, '009', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss')]);
    }

    const fileName = `TOT_${moment(date).format('DDMMYY')}.DAT`;
    const filePath = `/tmp/${fileName}`;
    const content = result.map((r) => r.join('|')).join('\n');
    fs.writeFileSync(filePath, content);

    const mailSubject = `TOTEM Sarea - COBRANZA - ${moment(date).format('DD/MM/YY')}`;

    winston.info('CvuController | generateSettlement | Settlement has been processed correctly.');
    await reportInfo({
      title: 'CVU - dailySettlement sin errores.',
      stack: {
        subject: mailSubject,
        transactions: transactions.map((i) => {
          return {
            id: i.id,
            amount: i.amount,
            type: i.type,
            createdOn: i.createdOn,
          };
        }),
        fileName: filePath,
      },
    });

    await reportSimple(`${fileName}\n\`\`\`txt\n${fs.readFileSync(filePath)}\`\`\``);

    if (debug) {
      return { msg: 'OK' };
    }

    await ngage.send({
      to: 'autogestion@cvu.com.uy',
      cc: 'proyectos@sarea.com.uy',
      from: config.ngage.from,
      subject: mailSubject,
      body: 'Adjunto el archivo',
      type: 'PRIVATE',
      attachments: [
        {
          filename: fileName,
          content: fs.readFileSync(filePath).toString('base64'),
          encoding: 'base64',
        },
      ],
    });

    return { msg: 'OK' };
  }
}
