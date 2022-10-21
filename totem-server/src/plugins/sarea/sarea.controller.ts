import { Body, Controller, HttpException, Post, UseGuards } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuthGuard } from 'src/guards/auth.guard';
import { Payment } from 'src/payments/entities/payment.entity';
import { PaymentsService } from 'src/payments/payments.service';
import { Refund } from 'src/refunds/entities/refund.entity';
import { RefundsService } from 'src/refunds/refunds.service';
import { Totem } from 'src/totems/entities/totem.entity';
import { TotemsService } from 'src/totems/totems.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { UsersService } from 'src/users/users.service';
import { reportError, reportInfo } from 'src/utils';
import * as winston from 'winston';
import { SareaCheckPaymentDto } from './dto/checkpayment.dto';
import { SareaCheckRefundDto } from './dto/checkrefund.dto';
import { SareaPayDto } from './dto/pay.dto';
import { SareaRefundDto } from './dto/refund.dto';
import { Sarea } from './sarea.connector';

@Controller('sarea')
export class SareaController {
  constructor(private users: UsersService, private transactions: TransactionsService, private payments: PaymentsService, private refunds: RefundsService, private totems: TotemsService) {}

  @UseGuards(AuthGuard)
  @Post('pay')
  async pay(@Body() body: SareaPayDto) {
    winston.info('SareaController | pay | body is:\n%o', body);

    const dbTransaction = await this.transactions.findOne(body.transactionId);
    dbTransaction.type = body.operation;
    dbTransaction.data = JSON.stringify(body);

    const dbUser = dbTransaction.user;
    dbUser.name = body.user.name;
    dbUser.cellphone = body.user.cel;
    dbUser.email = body.user.email;

    dbUser.docType = body.user.docType;
    dbUser.doc = body.user.docValue;

    dbTransaction.status = 'PAYING';

    const transaction: Transaction = await this.transactions.save(dbTransaction);

    const dbPayment = new Payment();
    dbPayment.transaction = transaction;
    dbPayment.startedOn = new Date();

    dbPayment.sucursalNum = '';
    dbPayment.terminalNum = '';
    dbPayment.posNum = '';
    dbPayment.terminalNum = '';

    dbPayment.amount = (parseFloat(body.amount.amount) * 100).toString();
    dbPayment.amountDiscount = '0';

    let payment: Payment = await this.payments.create(dbPayment);
    let sareaTrx;

    try {
      winston.debug('SareaController | pay | Posting transaction.');
      sareaTrx = await Sarea.postTransaccion({
        amount: payment.amount,
        mode: 'VTA',
        transaction: transaction,
      });
    } catch (err) {
      winston.error('SareaController | pay | Error on post transaction.');
      winston.error(err);
      throw new HttpException(err.message, 500);
    }

    if (sareaTrx['S:Envelope'] && sareaTrx['S:Envelope']['S:Body'] && sareaTrx['S:Envelope']['S:Body']['ns2:postTransaccionResponse'] && sareaTrx['S:Envelope']['S:Body']['ns2:postTransaccionResponse']['return']) {
      const sareaBody = sareaTrx['S:Envelope']['S:Body']['ns2:postTransaccionResponse']['return'];

      payment.token = sareaBody['token'];
      payment.timeout = sareaBody['segundos'];
      payment.trxPostCode = sareaBody['codigoRespuesta'];
      payment.trxPostData = sareaBody['detalleRespuesta'];
      payment = await this.payments.save(payment);
      winston.info('SareaController | pay | Transaction posted correctly.');
      winston.info(sareaBody);
    } else {
      winston.error("SareaController | pay | Sarea body doesn't match our ifs");
      throw new HttpException({ msg: "Sarea body doesn't match our ifs" }, 500);
    }

    return payment;
  }

  @Post('checkPayment')
  @UseGuards(AuthGuard)
  async checkPayment(@Body() body: SareaCheckPaymentDto) {
    winston.debug('SareaController | checkPayment | Checking payment status.');
    let payment: Payment = await this.payments.findOne(body.paymentId);
    let transaction: Transaction = await this.transactions.findOne(payment.transaction.id);

    let trxStatus;
    try {
      winston.debug('SareaController | checkPayment | Checking transaction.');
      trxStatus = await Sarea.consTransaccion({
        token: payment.token,
        transaction: transaction,
      });
    } catch (err) {
      winston.error('SareaController | checkPayment | Error on checking transaction.');
      winston.error(err);
      throw new HttpException({ msg: err.message }, 500);
    }

    if (trxStatus['S:Envelope'] && trxStatus['S:Envelope']['S:Body'] && trxStatus['S:Envelope']['S:Body']['ns2:consTransaccionResponse'] && trxStatus['S:Envelope']['S:Body']['ns2:consTransaccionResponse']['return']) {
      const sareaBody = trxStatus['S:Envelope']['S:Body']['ns2:consTransaccionResponse']['return'];

      payment.statusDesc = sareaBody['detalleRespuesta'];

      if (sareaBody['codigoRespuesta'] == 0) {
        if (sareaBody['codRespuestaEmisor'] == 98) {
          winston.info('SareaController | checkPayment | Transaction is being processed');
        } else if (sareaBody['codigoRespuesta'] == 96) {
          payment.status = 'ERROR';
          winston.error('SareaController | checkPayment | Transaction (SAREA) ERRORED.');
        } else {
          if (sareaBody['codRespuestaEmisor'] == 0) {
            payment.status = 'PAID';
            winston.info('SareaController | checkPayment | Transaction HAS BEEN PAID correctly.');
          } else {
            payment.finishedOn = new Date();
            payment.status = 'ERROR';
            winston.error('SareaController | checkPayment | Transaction (emisor) ERRORED.');
          }

          transaction.status = 'PAID';
          payment.finishedOn = new Date();
          payment.trxConsCodeIssuer = sareaBody['codRespuestaEmisor'].toString();
          payment.trxConsCode = sareaBody['codigoRespuesta'].toString();
          payment.trxConsCodeIssuerAuthCode = sareaBody['nroAutorizacionEmisor'].toString();
          payment.trxConsTicket = sareaBody['ticket'].toString();
          payment.trxConsVoucher = sareaBody['voucher'].toString();
          payment.trxConsAdquirente = sareaBody['idAdquirente'].toString();
        }
      } else if (sareaBody['codigoRespuesta'] == '01') {
        if (sareaBody['codRespuestaEmisor'] == 96) {
          payment.status = 'ERROR';
          winston.error('SareaController | checkPayment | Transaction (SAREA) ERRORED.');
        }
      }

      payment = await this.payments.save(payment);
      transaction = await this.transactions.save(transaction);

      return {
        id: payment.id,
        amount: payment.amount,
        amountDiscount: payment.amountDiscount,
        status: payment.status,
        statusDesc: payment.statusDesc,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          userId: transaction.userId,
          errorCode: transaction.errorCode,
          errorDesc: transaction.errorDesc,
        },
      };
      // }
    } else {
      winston.error("SareaController | checkPayment | Sarea body doesn't match our ifs");
      throw new HttpException({ msg: "Sarea body doesn't match our ifs" }, 500);
    }

    return payment;
  }

  @Post('refund')
  @UseGuards(AuthGuard)
  async refund(@Body() body: SareaRefundDto) {
    let payment = await this.payments.findOne(body.paymentId);
    if (!payment) {
      throw new HttpException({ msg: 'Payment not found' }, 404);
    }

    const ref = new Refund();
    ref.paymentId = payment.id;
    ref.status = 'REFUNDING';
    ref.startedOn = new Date();
    let refund = await this.refunds.create(ref);

    payment.refund = refund;
    payment.status = 'REFUNDING';
    payment = await this.payments.save(payment);

    const transaction = await this.transactions.findOne(payment.transactionId);

    let sareaTrx;
    try {
      winston.debug('SareaController | refund | Posting refund transaction.');
      sareaTrx = await Sarea.postTransaccion({
        amount: payment.amount,
        mode: 'ANU',
        ticket: payment.trxConsTicket,
        idAdquirente: payment.trxConsAdquirente,
        transaction: transaction,
      });
    } catch (err) {
      winston.error('SareaController | refund | Error on refund transaction.');
      winston.error(err);
      throw new HttpException(err.message, 500);
    }

    if (sareaTrx['S:Envelope'] && sareaTrx['S:Envelope']['S:Body'] && sareaTrx['S:Envelope']['S:Body']['ns2:postTransaccionResponse'] && sareaTrx['S:Envelope']['S:Body']['ns2:postTransaccionResponse']['return']) {
      const sareaBody = sareaTrx['S:Envelope']['S:Body']['ns2:postTransaccionResponse']['return'];

      refund.token = sareaBody['token'];
      refund.timeout = sareaBody['segundos'];
      refund.trxPostCode = sareaBody['codigoRespuesta'];
      refund.trxPostData = sareaBody['detalleRespuesta'];
      refund = await this.refunds.save(refund);

      winston.info('SareaController | refund | Transaction (refund) posted correctly.');
      winston.info(sareaBody);
    } else {
      winston.error("SareaController | refund | Sarea body doesn't match our ifs");
      throw new HttpException({ msg: "Sarea body doesn't match our ifs" }, 500);
    }

    return refund;
  }

  @Post('checkRefund')
  @UseGuards(AuthGuard)
  async checkRefund(@Body() body: SareaCheckRefundDto) {
    winston.debug('SareaController | checkRefund | Checking refund status.');

    let payment: Payment = await this.payments.findOne(body.paymentId);
    if (!payment.refund) {
      winston.error('SareaController | checkRefund | This payment has no refund');
      throw new HttpException('This payment has no refunds', 500);
    }

    const transaction: Transaction = await this.transactions.findOne(payment.transaction.id);
    let refund: Refund = await this.refunds.findOne(payment.refund.paymentId);

    let trxStatus;
    try {
      winston.debug('SareaController | checkRefund | Checking transaction.');
      trxStatus = await Sarea.consTransaccion({
        token: refund.token,
        transaction: transaction,
      });
    } catch (err) {
      winston.error('SareaController | checkRefund | Error on checking transaction.');
      winston.error(err);
      throw new HttpException(err.message, 500);
    }

    if (trxStatus['S:Envelope'] && trxStatus['S:Envelope']['S:Body'] && trxStatus['S:Envelope']['S:Body']['ns2:consTransaccionResponse'] && trxStatus['S:Envelope']['S:Body']['ns2:consTransaccionResponse']['return']) {
      const sareaBody = trxStatus['S:Envelope']['S:Body']['ns2:consTransaccionResponse']['return'];

      refund.statusDesc = sareaBody['detalleRespuesta'];

      if (sareaBody['codigoRespuesta'] == 0) {
        if (sareaBody['codRespuestaEmisor'] == 98) {
          winston.info('SareaController | checkRefund | Transaction is being processed');
        } else if (sareaBody['codigoRespuesta'] == 96) {
          refund.status = 'ERROR';
          refund.statusDesc = sareaBody['detalleRespuesta'];
          refund.finishedOn = new Date();
          transaction.status = 'ERROR_PAYMENT';
          winston.error('SareaController | checkRefund | Transaction (SAREA) ERRORED.');
        } else {
          if (sareaBody['codRespuestaEmisor'] == 0) {
            payment.status = 'REFUNDED';
            refund.status = 'REFUNDED';
            winston.info('SareaController | checkRefund | Transaction HAS BEEN REFUNDED correctly.');
          } else {
            transaction.status = 'ERROR_PAYMENT';
            refund.status = 'ERROR';
            refund.finishedOn = new Date();
            winston.error('SareaController | checkRefund | Transaction (emisor) ERRORED.');
          }

          refund.trxConsCodeIssuer = sareaBody['codRespuestaEmisor'].toString();
          refund.trxConsCode = sareaBody['codigoRespuesta'].toString();
          refund.trxConsCodeIssuerAuthCode = sareaBody['nroAutorizacionEmisor'].toString();
          refund.trxConsTicket = sareaBody['ticket'].toString();
          refund.trxConsVoucher = sareaBody['voucher'].toString();
          refund.trxConsAdquirente = sareaBody['idAdquirente'].toString();
          refund.finishedOn = new Date();
        }
      }

      refund = await this.refunds.save(refund);
      payment = await this.payments.save(payment);

      return {
        id: refund.paymentId,
        amount: refund.amount,
        amountDiscount: refund.amountDiscount,
        status: refund.status,
        statusDesc: refund.statusDesc,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          userId: transaction.userId,
          errorCode: transaction.errorCode,
          errorDesc: transaction.errorDesc,
        },
      };
    } else {
      winston.error("SareaController | checkRefund | Sarea body doesn't match our ifs");
      throw new HttpException({ msg: "Sarea body doesn't match our ifs" }, 500);
    }
  }

  runningSettlement = false;
  @Cron('50 11 * * *')
  @Post('cierreManual')
  async dailySettlement() {
    if (this.runningSettlement) {
      return {
        message: 'Error: Cierre manual YA iniciado.',
      };
    }

    this.runningSettlement = true;
    const totems = await this.totems.findWhere({
      outOfService: 0,
    });

    const promises = totems.map((totem) => {
      return new Promise((resolve) => {
        Sarea.postCierre(totem)
          .then(async (result) => {
            await this.checkSettlement(result);
            resolve('OK');
          })
          .catch((err) => {
            reportError({
              title: 'Error al enviar el request a Sarea (dailySettlement)',
              stack: {
                totemId: totem.id,
                totemName: totem.name,
                err: err.stack,
              },
            });

            resolve('OK');
          });
      });
    });

    Promise.all(promises).then(
      () => {
        this.runningSettlement = false;
      },
      () => {
        this.runningSettlement = false;
      },
    );

    return {
      message: 'Cierre manual iniciado.',
    };
  }

  checkSettlement(data: { totem: Totem; trxStatus: Record<any, any> }) {
    return new Promise<void>(async (resolve) => {
      const postTrxStatus = data.trxStatus;
      const totemAux = data.totem;

      const postCierreSareaBody = postTrxStatus['S:Envelope']['S:Body']['ns2:postCierreResponse']['return'];
      await new Promise((resolve) => setTimeout(resolve, postCierreSareaBody['segundos'] * 1000));
      if (postCierreSareaBody['codigoRespuesta'] == 0) {
        let attempts = 0;
        let success = false;
        let consCierreSareaBody;
        const token = postCierreSareaBody['token'];

        while (attempts < 10 && !success) {
          winston.debug('SareaController | checkSettlement | Checking settlement (totem: %s). Attempt %s', totemAux.id, attempts);
          const { trxStatus } = await Sarea.consCierre(token, totemAux);

          consCierreSareaBody = trxStatus['S:Envelope']['S:Body']['ns2:consCierreResponse']['return'];
          if (consCierreSareaBody['codigoRespuesta'] == 0) {
            if (consCierreSareaBody['codRespuestaEmisor'] == 0) {
              success = true;
              break;
            }
          }

          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (success) {
          winston.info('SareaController | checkSettlement | Settlement (totem: %s) has been processed correctly.', totemAux.id);
          reportInfo({
            title: 'dailySettlement sin errores.',
            stack: {
              totemId: totemAux.id,
              totemName: totemAux.name,
              desc: consCierreSareaBody,
            },
          });
        } else {
          winston.error('SareaController | checkSettlement | Settlement (totem: %s) has failed.', totemAux.id);
          reportInfo({
            title: 'dailySettlement sin respuesta correcta durante todos los attempts.',
            stack: {
              totemId: totemAux.id,
              totemName: totemAux.name,
              desc: consCierreSareaBody,
            },
          });
        }
        resolve();
      } else {
        winston.error('checkSettlement | Error posting the settlement.');
        reportError({
          title: 'El postTransaccion respondio un codigoRespuesta distinto a 0.',
          stack: {
            totemId: totemAux.id,
            totemName: totemAux.name,
            err: postTrxStatus,
          },
        });
        resolve();
      }
    });
  }
}
