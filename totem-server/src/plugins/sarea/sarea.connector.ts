import { config } from 'src/app.config';
import { Totem } from 'src/totems/entities/totem.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { getConnection, Repository } from 'typeorm';
import { SareaLog } from './calls/sareaLog.entity';

const builder = require('xmlbuilder');
const request = require('request');
const winston = require('winston');
const xmlParser = require('fast-xml-parser');

export class Sarea {
  static api_endpoint: string;
  static confEmisor: string;
  static confHash: string;

  public static init() {
    this.api_endpoint = 'http://itd.sarea.com.uy:30422/transSarea/transSareaItd';
    this.confHash = 'dsajkljlaskdj3432k4oioilkjnmbmds343129edfgfjlk4j32l4jjadsjk';
  }

  public static request(data, transactionId = null) {
    const call = new SareaLog();
    call.method = 'POST';
    call.body = data;
    call.url = this.api_endpoint;
    call.date = new Date();
    call.transactionId = transactionId;

    return new Promise((resolve, reject) => {
      request(
        {
          url: this.api_endpoint,
          headers: {
            'Content-Type': 'Content-Type text/xml; charset=utf-8',
          },
          method: 'POST',
          body: data,
        },
        async (error, result) => {
          call.responseStatus = result ? result.statusCode : 500;
          call.response = error ? JSON.stringify(error) : JSON.stringify(result.body);

          const repository: Repository<SareaLog> = await getConnection().getRepository('SareaLog');
          await repository.save(call);

          if (error || result?.statusCode != 200) {
            const errorAux = error || JSON.stringify(result?.body);
            winston.error('Sarea | request | Error. %s', errorAux);
            return reject(errorAux);
          }

          winston.info('Sarea | request | Success.', result.body);
          resolve(result.body);
        },
      );
    });
  }

  public static buildHeader() {
    const envelope = builder.create('soapenv:Envelope');
    envelope.attribute('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
    envelope.attribute('xmlns:itd', 'http://itd.transaSarea/');

    envelope.ele('soapenv:Header');
    const body = envelope.ele('soapenv:Body');
    return body;
  }

  public static async postTransaccion(data: { mode: string; amount: string; ticket?: string; idAdquirente?: string; transaction: Transaction }) {
    const xml = this.buildHeader();

    if (!data.idAdquirente) data.idAdquirente = '0';

    const item = xml.ele('itd:postTransaccion');
    item.ele('confComercio', data.transaction.totem.posTerminalId);
    item.ele('confEmisor', data.idAdquirente);
    item.ele('confTerminal', 0);
    item.ele('confHash', this.confHash);
    item.ele('confModoImpresion', 0);

    item.ele('transNroFactura', data.transaction.nroFactura);

    item.ele('transCuotas', 1);
    item.ele('transMoneda', 858);
    item.ele('transMonto', data.amount);
    item.ele('transMontoGravado', parseFloat(data.amount) * 0.88);
    item.ele('transMontoPropina', 0);
    item.ele('transOperacion', data.mode);

    if (data.mode == 'ANU') {
      item.ele('transTicketOriginal', data.ticket);
    }

    const xmlBody = xml.end({
      pretty: true,
    });

    winston.debug('Sarea | postTransaccion | xml\n%s', xmlBody);

    let sareaResponse;
    if (!config.sareaTesting) {
      sareaResponse = await this.request(xmlBody, data.transaction.id);
    } else {
      sareaResponse = `<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns2:postTransaccionResponse xmlns:ns2="http://itd.transaSarea/"><return><codigoRespuesta>00</codigoRespuesta><detalleRespuesta>TRANSACCION POSTEADA CON SUCESO</detalleRespuesta><segundos>1</segundos><token>eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2Mjk0OTEzODYsInNjb3BlcyI6WyIwIiwiMDAwMDAwMTgiLCIwMDAwIiwiMjUwMDAiLCIwODU4IiwiMjAyMTA4MjAiLCIxNzI4MDciXX0.2z2C5uNPoBTvg505R39feef-afiS26BjZC6GBAPrfKI</token></return></ns2:postTransaccionResponse></S:Body></S:Envelope>`;
    }
    winston.debug('Sarea | postTransaccion | sarea response\n%s', sareaResponse);

    const sareaResponseJson = xmlParser.parse(sareaResponse, { parseNodeValue: false });
    return sareaResponseJson;
  }

  public static async consTransaccion(data: { token: string; transaction: Transaction }) {
    const xml = this.buildHeader();

    const item = xml.ele('itd:consTransaccion', data);
    item.ele('token', data.token);
    const xmlBody = xml.end({
      pretty: true,
    });

    winston.debug('Sarea | consTransaccion | xml\n%s', xmlBody);

    let sareaResponse;
    if (!config.sareaTesting) {
      sareaResponse = await this.request(xmlBody, data.transaction.id);
    } else {
      sareaResponse = `<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><ns2:consTransaccionResponse xmlns:ns2="http://itd.transaSarea/"><return><codRespuestaEmisor>00</codRespuestaEmisor><codigoRespuesta>00</codigoRespuesta><detalleRespuesta>TRANSACCION EJECUTADA CON SUCESO</detalleRespuesta><idAdquirente>4</idAdquirente><monto>25000</monto><montoDescuento>000</montoDescuento><nroAutorizacionEmisor>121212</nroAutorizacionEmisor><ticket>0045</ticket><voucher></voucher></return></ns2:consTransaccionResponse></S:Body></S:Envelope> `;
    }

    winston.debug('Sarea | consTransaccion | sarea response\n%s', sareaResponse);

    const sareaResponseJson = xmlParser.parse(sareaResponse, { parseNodeValue: false });
    return sareaResponseJson;
  }

  public static async postCierre(totem: Totem): Promise<{ trxStatus: Record<any, any>; totem: Totem }> {
    const xml = this.buildHeader();

    const item = xml.ele('itd:postCierre');
    item.ele('confEmisor', 0);
    item.ele('confComercio', totem.posTerminalId);
    item.ele('confTerminal', 0);
    item.ele('confHash', this.confHash);
    item.ele('confModoImpresion', 0);

    const xmlBody = xml.end({
      pretty: true,
    });

    winston.debug('Sarea | postCierre | xml\n%s', xmlBody);

    const sareaResponse = await this.request(xmlBody);
    winston.debug('Sarea | postCierre | sarea response\n%s', sareaResponse);

    const sareaResponseJson = xmlParser.parse(sareaResponse, { parseNodeValue: false });
    return {
      trxStatus: sareaResponseJson,
      totem: totem,
    };
  }

  public static async consCierre(token: string, totem: Totem): Promise<{ trxStatus: Record<any, any>; totem: Totem }> {
    const xml = this.buildHeader();

    const item = xml.ele('itd:consCierre');
    item.ele('token', token);

    const xmlBody = xml.end({
      pretty: true,
    });

    winston.debug('Sarea | consCierre | xml\n%s', xmlBody);

    const sareaResponse = await this.request(xmlBody);
    winston.debug('Sarea | consCierre | sarea response\n%s', sareaResponse);

    const sareaResponseJson = xmlParser.parse(sareaResponse, { parseNodeValue: false });
    return {
      trxStatus: sareaResponseJson,
      totem: totem,
    };
  }
}
