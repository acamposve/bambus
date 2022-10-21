import { Module } from '@nestjs/common';
import { TagsModule } from 'src/tags/tags.module';
import { TagsService } from 'src/tags/tags.service';
import { TotemsModule } from 'src/totems/totems.module';
import { TotemsService } from 'src/totems/totems.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { TransactionsService } from 'src/transactions/transactions.service';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { CVU } from './cvu.connector';
import { CvuEvents } from './cvu.module';

const winston = require('winston');

@Module({
  imports: [TransactionsModule, UsersModule, TotemsModule, TagsModule],
})
export default class CvuHandler {
  constructor(private transactions: TransactionsService, private users: UsersService, private totems: TotemsService, private tags: TagsService) {
    console.log('CvuHandler constructor');

    CvuEvents.on('executeStart', (transaction: Transaction, vehicleData: any) => {
      if (transaction.type == 'NEW_CLIENT') {
        this.addCliente(transaction.id, vehicleData);
      } else if (transaction.type == 'ADD_VEHICLE') {
        this.addVehiculo(transaction.id, vehicleData);
      } else if (transaction.type == 'ASSIGN_TAG') {
        this.addTag(transaction.id, vehicleData);
      } else if (transaction.type == 'RECHARGE') {
        this.recharge(transaction.id);
      }
    });
  }

  async addCliente(transactionId: number, vehicleData: any) {
    const transaction: Transaction = await this.transactions.findOne(transactionId);

    const tag = await this.tags.find({ id: transaction.theoricTagId });
    const cvuAnswer = await CVU.WS_CliInsPrep_OutIdCliente(transaction, vehicleData, tag);

    if (cvuAnswer['WS_CliInsPrep_OutIdClienteResult'] != '0') {
      transaction.status = 'ERROR';
      transaction.errorCode = 'error';
      transaction.errorDesc = cvuAnswer['AuxObservacion'];
      winston.error('CvuHandler | addCliente | Error for transaction %o, %o', transaction.id, cvuAnswer);
      await this.transactions.save(transaction);
      return;
    }

    transaction.user.externalId = cvuAnswer['AuxIdCliente'];

    winston.debug('CvuHandler | addCliente | Success for transaction %s', transaction.id);

    await this.totems.save(transaction.totem);
    await this.transactions.save(transaction);
    await this.recharge(transaction.id);
  }

  async addVehiculo(transactionId: number, vehicleData: any) {
    let transaction = await this.transactions.findOne(transactionId);
    const tag = await this.tags.find({ id: transaction.theoricTagId });
    const cvuAnswer = await CVU.WS_AddVehiculoIns(transaction, vehicleData, tag);

    if (cvuAnswer['WS_AddVehiculoInsResult'] != '0') {
      transaction.status = 'ERROR';
      transaction.errorCode = 'error';
      transaction.errorDesc = cvuAnswer['AuxObservacion'];
      winston.error('CvuHandler | addVehiculo | Error for transaction %o, %o', transaction.id, cvuAnswer);
      await this.transactions.save(transaction);
      return;
    }

    winston.debug('CvuHandler | addVehiculo | Success for transaction %s', transaction.id);
    transaction.totem.lastTransactionId = transaction.id;

    await this.totems.save(transaction.totem);
    transaction = await this.transactions.save(transaction);
    await this.recharge(transaction.id);
  }

  async addTag(transactionId: number, vehicleData: any) {
    let transaction = await this.transactions.findOne(transactionId);
    const tag = await this.tags.find({ id: transaction.theoricTagId });
    const cvuAnswer = await CVU.WS_AsigTagIns(transaction, vehicleData, tag);

    if (cvuAnswer['WS_AsigTagInsResult'] != '0') {
      transaction.status = 'ERROR';
      transaction.errorCode = 'error';
      transaction.errorDesc = cvuAnswer['AuxObservacion'];
      winston.error('CvuHandler | addTag | Error for transaction %o, %o', transaction.id, cvuAnswer);
      await this.transactions.save(transaction);
      return;
    }

    winston.debug('CvuHandler | addTag | Success for transaction %s', transaction.id);
    transaction.totem.lastTransactionId = transaction.id;

    await this.totems.save(transaction.totem);
    transaction = await this.transactions.save(transaction);

    await this.recharge(transaction.id);
  }

  async recharge(transactionId: number) {
    const transaction = await this.transactions.findOne(transactionId);
    const tag = await this.tags.find({ id: transaction.theoricTagId });

    winston.debug('CvuHandler | recharge | transaction: %o', transaction);

    let cvuAnswer;
    try {
      cvuAnswer = await CVU.RecargarCuenta({ transaction: transaction, nroCliente: transaction.user.externalId, importe: transaction.amount }, tag);
      if (cvuAnswer['RecargarCuenta_serieResult'] != 'true') {
        transaction.status = 'ERROR';
        transaction.errorCode = 'error';
        transaction.errorDesc = cvuAnswer['xsObservacion'];
        winston.error('CvuHandler | recharge | Error for transaction %o, %o', transaction.id, cvuAnswer);
        await this.transactions.save(transaction);
        return;
      }
    } catch (exc) {
      transaction.status = 'ERROR';
      transaction.errorCode = 'error';
      transaction.errorDesc = 'Ocurrió un problema en el servidor';
      winston.error('CvuHandler | recharge | Exception catched for transaction %o, %o', transaction.id, cvuAnswer);
      await this.transactions.save(transaction);
      return;
    }

    transaction.status = 'EXECUTED';
    transaction.errorCode = '';
    transaction.errorDesc = '';

    transaction.nroFactura = cvuAnswer['xsNroFactura'];
    transaction.serieFactura = cvuAnswer['xsSerieFactura'];

    winston.debug('CvuHandler | recharge | Success for transaction %s', transaction.id);

    transaction.totem.lastTransactionId = transaction.id;
    await this.totems.save(transaction.totem);

    await this.transactions.save(transaction);
  }
}
