const builder = require('xmlbuilder');
const winston = require('winston');
const moment = require('moment');

var transaction = {
  id: 1,
};

class Prueba {
  constructor() {
    this.username = 'srt';
    this.password = 'sr81tes';

    winston.debug('CVU | WS_AddVehiculoDel.');
    var envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://www.w3.org/2003/05/soap-envelope');
    envelope.ele('Header');

    var body = envelope.ele('Body');
    var operacion = body.ele('WS_AddVehiculoDel');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxRef', `TOT${transaction.id}`);
    operacion.ele('AuxFecIng', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxUsuWS', this.username);
    operacion.ele('AuxSector');
    operacion.ele('AuxTerminal');
    operacion.ele('AuxPassUsuWS', this.password);
    operacion.ele('AuxObservacion');

    var xmlBody = envelope.end({
      pretty: true,
    });
    console.log(xmlBody);
  }
}

new Prueba();
