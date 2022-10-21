import { config } from 'src/app.config';
import { Tag } from 'src/tags/entities/tag.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { getConnection, Repository } from 'typeorm';
import { CvuLog } from './calls/cvuLog.entity';

const builder = require('xmlbuilder');
const request = require('request');
const winston = require('winston');
const xmlParser = require('fast-xml-parser');
const moment = require('moment');

export class CVU {
  static api_endpoint: string;
  static username: string;
  static password: string;
  static is_prod = false;

  public static init() {
    this.api_endpoint = 'http://192.168.1.55';
    this.username = 'srt';
    this.password = 'sr81tes';

    this.is_prod = true;

    // PROD
    if (this.is_prod) {
      this.username = 'sr';
      this.password = 'sr81prod';
    }
  }

  public static request(data, url, transactionId = null) {
    const call = new CvuLog();
    call.method = 'POST';
    call.body = data;
    call.url = url;
    call.date = new Date();
    call.transactionId = transactionId;

    return new Promise((resolve, reject) => {
      const reqUrl = `${this.api_endpoint}/${url}`;
      winston.info('CVU | request | Sending request to %s...', reqUrl);
      request(
        {
          url: reqUrl,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
          },
          method: 'POST',
          body: data,
          timeout: 30000,
        },
        async (error, result) => {
          try {
            call.responseStatus = result ? result.statusCode : 500;
            call.response = error ? JSON.stringify(error) : JSON.stringify(result.body);

            const repository: Repository<CvuLog> = await getConnection().getRepository('CvuLog');
            await repository.save(call);

            if (error || result?.statusCode != 200) {
              const errorAux = error || JSON.stringify(result?.body);
              winston.error('CVU | request | CVU Rerturned statusCode %s with body: %s', result?.statusCode, errorAux);
              return reject(errorAux);
            }

            winston.info('CVU | request | Success.', result.body);
            resolve(result.body);
          } catch (exc) {
            winston.error('CVU | request | Exception catched!');
            throw exc;
          }
        },
      );
    });
  }

  public static async WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdCliente(data: { docType: number; docValue: string; vehiclePlateNumber: string; transaction: Transaction }) {
    winston.debug('CVU | WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdCliente.');
    const envelope = builder.create('soapenv:Envelope');
    envelope.attribute('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
    envelope.attribute('xmlns:tem', 'http://tempuri.org/');

    envelope.ele('soapenv:Header');

    const body = envelope.ele('soapenv:Body');
    const operacion = body.ele('tem:WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdCliente');

    operacion.ele('tem:AuxTpoDocumento', data.docType);
    operacion.ele('tem:AuxDocumento', data.docValue);

    operacion.ele('tem:AuxMatricula', data.vehiclePlateNumber);

    operacion.ele('tem:AuxSector', data.transaction.totemId);
    operacion.ele('tem:AuxTerminal', data.transaction.totemId);

    operacion.ele('tem:AuxUsuWS', this.username);
    operacion.ele('tem:AuxPassUsuWS', this.password);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdCliente | xml\n%s', xmlBody);
    let cvuResponse;
    let url;
    if (!config.cvuTesting) {
      url = 'WS_CVU_T2/WS_CVU.asmx';
      if (this.is_prod) {
        url = 'WS_CVU_SAREA/WS_CVU.asmx';
      }
      cvuResponse = await this.request(xmlBody, url, data.transaction.id);
    } else {
      cvuResponse = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdClienteResponse xmlns="http://tempuri.org/"><WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdClienteResult>0</WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdClienteResult><AuxIdOperacion>1</AuxIdOperacion><AuxValTag>180.0000</AuxValTag><AuxIdCliente>0</AuxIdCliente><AuxObservacion /></WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdClienteResponse></soap:Body></soap:Envelope>`;
    }
    winston.debug('CVU | WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdCliente | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_TpoOperacionContactoSelXDocumentoMatricula_OutIdClienteResponse'];
    return cvuResponseJson;
  }

  public static async WS_MarcaSelAll() {
    winston.debug('CVU | WS_MarcaSelAll.');

    const envelope = builder.create('soapenv:Envelope');
    envelope.attribute('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
    envelope.attribute('xmlns:tem', 'http://tempuri.org/');
    envelope.ele('soapenv:Header');

    const body = envelope.ele('soapenv:Body');
    const operacion = body.ele('tem:WS_MarcaSelAll');

    operacion.ele('tem:AuxUsuWs', this.username);
    operacion.ele('tem:AuxPassUsuWS', this.password);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_MarcaSelAll | xml\n%s', xmlBody);
    let cvuResponse, url;
    if (!config.cvuTesting) {
      url = 'WS_CVU_T2/WS_CVU.asmx';
      if (this.is_prod) {
        url = 'WS_CVU_SAREA/WS_CVU.asmx';
      }
      cvuResponse = await this.request(xmlBody, url);
    } else {
      cvuResponse =
        '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><WS_MarcaSelAllResponse xmlns="http://tempuri.org/"><WS_MarcaSelAllResult>305#ACURA@302#AEOLUS@296#AGRALE@60#AGRALE@2#ALFA ROMEO@151#AMC@176#ANCHI@301#ANKAI@139#ANTONINI@166#ARO@147#ARON@59#ASIA@3#AUDI@58#AUSTIN@182#B Y D@263#B200@283#BAIC YINXIANG@207#BARREIRO@236#BATRICAR@62#BEDFORD@287#BENTLEY@313#BESTUNE@133#BLACK@208#BMC@4#BMW@175#BORGWARD@237#BRIGG AND STRATTON@285#BRILLIANCE@146#BRILLIANCE@118#BUSSCAR@144#BUSSING@217#BYD@8#CADILLAC@129#CAIO@141#CAMC@63#CHANA@223#CHANG FEI@128#CHANGAN@252#CHANGE@169#CHANGHE@64#CHERY@107#CHEVETTE@5#CHEVROLET@6#CHRYSLER@111#CHRYSLER@121#CIFERAL@7#CITROEN@290#COLES@65#COMMER@249#COUPE@66#DACIA@9#DAEWOO@192#DAF@10#DAIHATSU@11#DAIMLER@246#DAS@49#DATSUN@132#DEER@161#DELONG F2000@292#DEMAG@67#DFM@215#DFSK@149#DKW@12#DODGE@137#DONG FENG@150#EBRO@180#EESSEX@56#EFFA@280#ENGESA@286#ERF@124#FACANSA@68#FARGO@69#FAW@13#FERRARI@14#FIAT@274#FISKER@230#FLYMOUTH@15#FORD@86#FOTON@247#FOTON@202#FREHAUF@93#FREIGHTLINER@70#FSO@167#FUQI@248#GALLOPER@277#GAZ@87#GEELY@266#GILLY@71#GMC@101#GONOW@127#GREAT WALL@315#GRENN TOUR@184#GREYHOUND@289#GROVE@138#GRUMETTE@73#GWM@221#HA/MA@225#HAFEI@218#HAIMA@239#HANOMAG@295#HAVAL@214#HIGER@72#HILLMAN@245#HINO@16#HONDA@272#HONKER@187#HOWO@238#HUANGHAI@267#HUDSON @17#HUMMER@307#HYSTER@18#HYUNDAI@224#IBC@158#IDEALE 770@229#IES@220#INDIANA@109#INDIO@19#INFINITI@51#INTERNATIONAL@131#IRIZAR@299#ISARD@20#ISUZU@183#ITASKOCEVJE@21#IVECO@94#JAC@22#JAGUAR@104#JBC@304#JCB@23#JEEP@308#JETOUR@168#JINBEI@74#JMC@273#KALMAR@212#KAMAZ@311#KARRY@258#KENWORTH@24#KIA@198#KING@241#KINGSTAR@219#KOMATSU@282#KRAZ@205#KRUPP@108#KYMCO@48#LADA@96#LAMBORGHINI@98#LANCIA@25#LAND ROVER@105#LANROU@26#LEXUS@142#LEYLAND@159#LIAZ@188#LIEBHERR@100#LIFAN@157#LINCE@135#LINCOLN@213#LOTUS@197#MACK@52#MAESTRO@179#MAGUIRUZ DEUTZ@75#MAHINDRA@145#MAN@120#MARCOPOLO@226#MARINA@114#MARUTI@27#MASERATI@234#MASSEY@156#MAXIBUS@28#MAZDA@116#MB@222#MDF@29#MERCEDES BENZ@201#MERCURY@284#METONG@122#METRO@30#MG@31#MINI@32#MITSUBISHI@312#MOBILITY@76#MORRIS@278#MOWAG@95#MUDAN@298#NEW FUSO@233#NEW HOLLAND@119#NIELSON@33#NISSAN@174#NKR@177#NOBLE@211#NSU@78#OKA@77#OLTCIT@53#OM@54#OPEL@178#ORIENT@269#OVERLAND@209#PANHARD@275#PEGASSO@293#PETERBILT@34#PEUGEOT@79#PIAGGIO@297#PIERCE QUANTUM@80#PLYMOUTH@35#PONTIAC@143#PONY@36#PORSCHE@181#PROTON@85#RANGE ROVER@81#RASTROJERO@37#RENAULT@270#REO@199#ROBBUR@38#ROVER@243#RULO@61#S90D@39#SAAB@106#SAMSUNG@317#SANY@318#SANY_@82#SAW@50#SCANIA@303#SCANIA@40#SEAT@172#SEDDON@130#SERRANA@173#SHA ZHOU@242#SHINERAY@97#SIMCA@113#SINOTRUK HOWO@83#SKODA@88#SMA@134#SMART@41#SSANGYONG@240#SSANGYONG@253#SSANGYONG@260#SSANGYONG@227#STANDARD@160#STEYR@84#STUDEBAKER@42#SUBARU@309#SUNTAE@43#SUZUKI@254#T-KING@136#TALBOT@44#TATA@276#TATRA@271#TEREX@306#TESLA@155#THAMCO@103#THAMES@279#THYSSEN HENSCHEL@294#TIGR@235#TIGRE@210#TMC@89#TONGBAO@264#TORINO@45#TOYOTA@231#TRANSIT@314#TRIUMPH@190#TUEJIN@255#UAZ@90#UFO@112#UNIMOG@256#URAL@232#URO@163#VAUXHALL@57#VICTORY@140#VISCAZO@259#VOLARE@46#VOLKSWAGEN@47#VOLVO@316#VW@244#WHITE@115#WILLYS@228#WINGLE@91#WULING@125#WULING@250#XCMG@92#XINKAI@203#XSAUTO@102#YANPAI@148#YASUKI@165#YCACO@117#YOUYI@110#YUEJIN@310#YUMBO@123#YUTONG@206#ZASTAVA@216#ZHONGTONG@251#ZNA@170#ZOTYE@99#zoyte@55#ZXAUTO@</WS_MarcaSelAllResult><AuxObservacion /></WS_MarcaSelAllResponse></soap:Body></soap:Envelope>';
    }
    winston.debug('CVU | WS_MarcaSelAll | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_MarcaSelAllResponse']['WS_MarcaSelAllResult'];
    return cvuResponseJson;
  }

  public static async WS_ModeloSelXMarca(codMarca) {
    winston.debug('CVU | WS_ModeloSelXMarca.');

    console.log(config.cvuTesting);
    const envelope = builder.create('soapenv:Envelope');
    envelope.attribute('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
    envelope.attribute('xmlns:tem', 'http://tempuri.org/');
    envelope.ele('soapenv:Header');

    const body = envelope.ele('soapenv:Body');
    const operacion = body.ele('tem:WS_ModeloSelXMarca');

    operacion.ele('tem:AuxCodMarcas', codMarca);
    operacion.ele('tem:AuxUsuWs', this.username);
    operacion.ele('tem:AuxPassUsuWS', this.password);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_ModeloSelXMarca | xml\n%s', xmlBody);

    let cvuResponse, url;
    if (!config.cvuTesting) {
      url = 'WS_CVU_T2/WS_CVU.asmx';
      if (this.is_prod) {
        url = 'WS_CVU_SAREA/WS_CVU.asmx';
      }
      cvuResponse = await this.request(xmlBody, url);
    } else {
      cvuResponse =
        '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><WS_ModeloSelXMarcaResponse xmlns="http://tempuri.org/"><WS_ModeloSelXMarcaResult>2780#Model 3@2781#Model Roadster@2782#Model S@2778#Model X@2779#Model Y@</WS_ModeloSelXMarcaResult><AuxObservacion /></WS_ModeloSelXMarcaResponse></soap:Body></soap:Envelope>';
    }
    winston.debug('CVU | WS_ModeloSelXMarca | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_ModeloSelXMarcaResponse']['WS_ModeloSelXMarcaResult'];
    return cvuResponseJson;
  }

  public static async WS_ColorSelAll() {
    winston.debug('CVU | WS_ColorSelAll.');

    const envelope = builder.create('soapenv:Envelope');
    envelope.attribute('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/');
    envelope.attribute('xmlns:tem', 'http://tempuri.org/');
    envelope.ele('soapenv:Header');

    const body = envelope.ele('soapenv:Body');
    const operacion = body.ele('tem:WS_ColorSelAll');

    operacion.ele('tem:AuxUsuWs', this.username);
    operacion.ele('tem:AuxPassUsuWS', this.password);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_ColorSelAll | xml\n%s', xmlBody);
    let url = 'WS_CVU_T2/WS_CVU.asmx';
    if (this.is_prod) {
      url = 'WS_CVU_SAREA/WS_CVU.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url);
    winston.debug('CVU | WS_ColorSelAll | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_ColorSelAllResponse']['WS_ColorSelAllResult'];
    return cvuResponseJson;
  }

  public static async WS_CliInsPrep_OutIdCliente(transaction: Transaction, vehicle: { brand: { id: number; name: string }; model: { id: number; name: string }; color: { id: number; name: string }; plateNumber: string }, tag: Tag) {
    winston.debug('CVU | WS_CliInsPrep_OutIdCliente.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://schemas.xmlsoap.org/soap/envelope/');
    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('WS_CliInsPrep_OutIdCliente');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxTpoDocumento', transaction.user.docType);
    operacion.ele('AuxDocumento', transaction.user.doc);
    operacion.ele('AuxNombre', transaction.user.name);
    operacion.ele('AuxTelefonoCelular', transaction.user.cellphone);
    operacion.ele('AuxTelefonoFijo', '');
    operacion.ele('AuxEmail', transaction.user.email);

    operacion.ele('AuxMatricula', vehicle.plateNumber);
    operacion.ele('AuxMarca', vehicle.brand.id);
    operacion.ele('AuxModelo', vehicle.model.id);
    operacion.ele('AuxColor', vehicle.color.id);
    operacion.ele('AuxTag', tag.code);

    operacion.ele('AuxFecIng', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxUsuWS', this.username);
    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);
    operacion.ele('AuxRef', `TOT-NC-${transaction.id}-${tag.rollId}-${tag.id}`);
    operacion.ele('AuxPassUsuWS', this.password);
    operacion.ele('AuxObservacion', '');
    operacion.ele('AuxValTag', '0.0');
    operacion.ele('AuxIdCliente', '0');

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_CliInsPrep_OutIdCliente | xml\n%s', xmlBody);
    let cvuResponse;
    if (!config.cvuTesting) {
      let url = 'WS_CVU_T2/WS_CVU.asmx';
      if (this.is_prod) {
        url = 'WS_CVU_SAREA/WS_CVU.asmx';
      }

      cvuResponse = await this.request(xmlBody, url, transaction.id);
    } else {
      // CASO: Nuevo Tag limpio
      cvuResponse = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><WS_CliInsPrep_OutIdClienteResponse xmlns="http://tempuri.org/"><WS_CliInsPrep_OutIdClienteResult>0</WS_CliInsPrep_OutIdClienteResult><AuxObservacion /><AuxValTag>180.0000</AuxValTag><AuxIdCliente>390105</AuxIdCliente></WS_CliInsPrep_OutIdClienteResponse></soap:Body></soap:Envelope>`;
    }
    winston.debug('CVU | WS_CliInsPrep_OutIdCliente | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_CliInsPrep_OutIdClienteResponse'];
    return cvuResponseJson;
  }

  public static async WS_CliDelPrep(transaction: Transaction, tag: Tag) {
    winston.debug('CVU | WS_CliDelPrep.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://www.w3.org/2003/05/soap-envelope');
    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('WS_CliDelPrep');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxRef', `TOT-NC-${transaction.id}-${tag.rollId}-${tag.id}`);
    operacion.ele('AuxFecIng', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxUsuWS', this.username);
    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);
    operacion.ele('AuxPassUsuWS', this.password);
    operacion.ele('AuxObservacion');
    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_CliDelPrep | xml\n%s', xmlBody);

    let url = 'WS_CVU_T2/WS_CVU.asmx';
    if (this.is_prod) {
      url = 'WS_CVU_SAREA/WS_CVU.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | WS_CliDelPrep | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_CliDelPrepResponse'];
    return cvuResponseJson;
  }

  public static async WS_AddVehiculoIns(transaction: Transaction, vehicle: { brand: { id: number; name: string }; model: { id: number; name: string }; color: { id: number; name: string }; plateNumber: string }, tag: Tag) {
    winston.debug('CVU | WS_AddVehiculoIns.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://www.w3.org/2003/05/soap-envelope');
    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('WS_AddVehiculoIns');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxTpoDocumento', transaction.user.docType);
    operacion.ele('AuxDocumento', transaction.user.doc);
    operacion.ele('AuxTelefonoCelular', transaction.user.cellphone);
    operacion.ele('AuxEmail', transaction.user.email);
    operacion.ele('AuxMatricula', vehicle.plateNumber);
    operacion.ele('AuxMarca', vehicle.brand.id);
    operacion.ele('AuxModelo', vehicle.model.id);
    operacion.ele('AuxColor', vehicle.color.id);

    operacion.ele('AuxTag', tag.code);
    operacion.ele('AuxFecIng', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxUsuWS', this.username);
    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);
    operacion.ele('AuxRef', `TOT-NV-${transaction.id}-${tag.rollId}-${tag.id}`);
    operacion.ele('AuxTicket', `0`);
    operacion.ele('AuxPassUsuWS', this.password);
    operacion.ele('AuxObservacion');
    operacion.ele('AuxValTag', 0);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_AddVehiculoIns | xml\n%s', xmlBody);

    let url = 'WS_CVU_T2/WS_CVU.asmx';
    if (this.is_prod) {
      url = 'WS_CVU_SAREA/WS_CVU.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | WS_AddVehiculoIns | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_AddVehiculoInsResponse'];
    return cvuResponseJson;
  }

  public static async WS_AddVehiculoDel(transaction: Transaction, tag: Tag) {
    winston.debug('CVU | WS_AddVehiculoDel.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://www.w3.org/2003/05/soap-envelope');
    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('WS_AddVehiculoDel');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxRef', `TOT-NV-${transaction.id}-${tag.rollId}-${tag.id}`);
    operacion.ele('AuxFecIng', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxUsuWS', this.username);
    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);
    operacion.ele('AuxPassUsuWS', this.password);
    operacion.ele('AuxObservacion');

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_AddVehiculoDel | xml\n%s', xmlBody);

    let url = 'WS_CVU_T2/WS_CVU.asmx';
    if (this.is_prod) {
      url = 'WS_CVU_SAREA/WS_CVU.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | WS_AddVehiculoDel | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_AddVehiculoDelResponse'];
    return cvuResponseJson;
  }

  public static async WS_AsigTagIns(transaction: Transaction, vehicle: { brand: { id: number; name: string }; model: { id: number; name: string }; color: { id: number; name: string }; plateNumber: string }, tag: Tag) {
    winston.debug('CVU | WS_AsigTagIns.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://www.w3.org/2003/05/soap-envelope');
    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('WS_AsigTagIns');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxTpoDocumento', transaction.user.docType);
    operacion.ele('AuxDocumento', transaction.user.doc);
    operacion.ele('AuxTelefonoCelular', transaction.user.cellphone);
    operacion.ele('AuxEmail', transaction.user.email);

    operacion.ele('AuxMatricula', vehicle.plateNumber);
    operacion.ele('AuxTag', tag.code);
    operacion.ele('AuxFecIng', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxUsuWS', this.username);

    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);

    operacion.ele('AuxRef', `TOT-AT-${transaction.id}-${tag.rollId}-${tag.id}`);

    operacion.ele('AuxTicket', `0`);

    operacion.ele('AuxPassUsuWS', this.password);

    operacion.ele('AuxObservacion');
    operacion.ele('AuxValTag', 0);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_AsigTagIns | xml\n%s', xmlBody);

    let url = 'WS_CVU_T2/WS_CVU.asmx';
    if (this.is_prod) {
      url = 'WS_CVU_SAREA/WS_CVU.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | WS_AsigTagIns | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_AsigTagInsResponse'];
    return cvuResponseJson;
  }

  public static async WS_AsigTagDel(transaction: Transaction, tag: Tag) {
    winston.debug('CVU | WS_AsigTagDel.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://www.w3.org/2003/05/soap-envelope');
    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('WS_AsigTagDel');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxRef', `TOT-AT-${transaction.id}-${tag.rollId}-${tag.id}`);
    operacion.ele('AuxFecIng', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxUsuWS', this.username);

    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);

    operacion.ele('AuxPassUsuWS', this.password);
    operacion.ele('AuxObservacion');

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_AsigTagDel | xml\n%s', xmlBody);

    let url = 'WS_CVU_T2/WS_CVU.asmx';
    if (this.is_prod) {
      url = 'WS_CVU_SAREA/WS_CVU.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | WS_AsigTagDel | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_AsigTagDelResponse'];
    return cvuResponseJson;
  }

  public static async ConsultarCuenta(data: { docType: number; docValue: string; transaction: Transaction }) {
    winston.debug('CVU | ConsultarCuenta.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://schemas.xmlsoap.org/soap/envelope/');

    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('ConsultarCuenta');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('xsUsuario', this.username);
    operacion.ele('xsPass', this.password);

    operacion.ele('xiTipoCli', data.docType == 1 ? '1' : '2');
    operacion.ele('xsIdentificadorCli', data.docValue);

    operacion.ele('xsSubagencia', data.transaction.totemId);
    operacion.ele('xsTerminal', data.transaction.totemId);

    operacion.ele('xsCuentaHabilitada');
    operacion.ele('xiNroCliente', 0);
    operacion.ele('xsNombreCliente');
    operacion.ele('xdSaldo', 0);
    operacion.ele('xsObservacion');
    operacion.ele('xdImporteMin', 0);
    operacion.ele('xdImporteMax', 0);
    operacion.ele('xiTiempoMaxParaReversar', 0);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | ConsultarCuenta | xml\n%s', xmlBody);
    try {
      let url = 'ccowsconcue_T1/ccowsconcue.asmx';
      if (this.is_prod) {
        url = 'ccowsconcue/ccowsconcue.asmx';
      }

      const cvuResponse = await this.request(xmlBody, url, data.transaction.id);
      winston.debug('CVU | ConsultarCuenta | cvu response\n%s', cvuResponse);

      const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['ConsultarCuentaResponse'];
      return cvuResponseJson;
    } catch (exc) {
      winston.error('CVU | ConsultarCuenta | Exception catched!');
      throw exc;
    }
  }

  public static async RecargarCuenta(data: { transaction: Transaction; nroCliente: string; importe: string }, tag?: Tag) {
    winston.debug('CVU | RecargarCuenta.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://schemas.xmlsoap.org/soap/envelope/');

    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('RecargarCuenta_serie');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('xsUsuario', this.username);
    operacion.ele('xsPass', this.password);
    operacion.ele('xiNroCliente', data.nroCliente);

    operacion.ele('xdFechaHoraRecarga', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('xdImporteRecarga', data.importe);
    operacion.ele('xsSubagencia', data.transaction.totemId);
    operacion.ele('xsTerminal', data.transaction.totemId);
    operacion.ele('xsTransaccion', `TOT-RC-${data.transaction.id}-${data.nroCliente}${tag ? `-${tag.id}` : ''}`);
    operacion.ele('xsObservacion');
    operacion.ele('xsDevuelveIva');
    operacion.ele('xsNroFactura', 0);
    operacion.ele('xsSerieFactura');
    operacion.ele('xdImporteGravadoSinIva', 0);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | RecargarCuenta | xml\n%s', xmlBody);
    let cvuResponse;
    if (!config.cvuTesting) {
      let url = 'ccowsreccueif_t1/ccowsreccueif.asmx';
      if (this.is_prod) {
        url = 'CcoWsRecCueIF/CcoWsRecCueIF.asmx';
      }

      cvuResponse = await this.request(xmlBody, url, data.transaction.id);
    } else {
      cvuResponse = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><RecargarCuenta_serieResponse xmlns="http://tempuri.org/"><RecargarCuenta_serieResult>true</RecargarCuenta_serieResult><xsObservacion /><xsDevuelveIva>00</xsDevuelveIva><xsNroFactura>3218537</xsNroFactura><xsSerieFactura>BE</xsSerieFactura><xdImporteGravadoSinIva>204.92</xdImporteGravadoSinIva></RecargarCuenta_serieResponse></soap:Body></soap:Envelope>`;
    }
    winston.debug('CVU | RecargarCuenta | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['RecargarCuenta_serieResponse'];
    return cvuResponseJson;
  }

  public static async ReversarRecargaCuenta(transaction: Transaction, tag?: Tag) {
    winston.debug('CVU | ReversarRecargaCuenta.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://schemas.xmlsoap.org/soap/envelope/');

    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('ReversarRecargaCuenta');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('xsUsuario', this.username);
    operacion.ele('xsPass', this.password);

    operacion.ele('xsTransaccion', `TOT-RC-${transaction.id}-${transaction.user.externalId}${tag ? `-${tag.id}` : ''}`);
    operacion.ele('xdFechaHoraReversa', moment().utcOffset(-3).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('xsSubagencia', transaction.totemId);
    operacion.ele('xsTerminal', transaction.totemId);
    operacion.ele('xsObservacion');

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | ReversarRecargaCuenta | xml\n%s', xmlBody);

    let url = 'ccowsrevreccue_T1/ccowsrevreccue.asmx';
    if (this.is_prod) {
      url = 'ccowsrevreccue/ccowsrevreccue.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | ReversarRecargaCuenta | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: true })['soap:Envelope']['soap:Body']['ReversarRecargaCuentaResponse'];
    return cvuResponseJson;
  }

  public static async ConfirmarRecarga(transaction: Transaction, tag?: Tag) {
    winston.debug('CVU | ConfirmarRecarga.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://schemas.xmlsoap.org/soap/envelope/');

    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('OP_ConfirmarRecarga');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    operacion.ele('AuxIdTipoRecarga', '1');
    operacion.ele('AuxIdAgenteCobranza', 'sr');

    const isDebit = transaction.payments.slice(-1)[0].trxConsVoucher.indexOf('COMPRA DEBITO') > -1;
    const ref = `TOT-RC-${transaction.id}-${transaction.user.externalId}${tag ? `-${tag.id}` : ''}`;
    operacion.ele('AuxIdMedioPago', isDebit ? 1 : 2);

    operacion.ele('AuxIdCliente', transaction.user.externalId);
    operacion.ele('AuxIdTransaccion', ref);
    operacion.ele('AuxFechaRecarga', moment(transaction.payments.slice(-1)[0].finishedOn).format('DD/MM/yyyy HH:mm:ss'));
    operacion.ele('AuxAutorizacion');
    operacion.ele('AuxImporte', transaction.amount);
    operacion.ele('AuxIdMoneda', 'UYU');

    operacion.ele('AuxToken');

    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);

    // tbd: definir
    operacion.ele('AuxEstado');
    operacion.ele('AuxDetalleError');

    operacion.ele('AuxIdUsuWS', this.username);
    operacion.ele('AuxPassWS', this.password);

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | ConfirmarRecarga | xml\n%s', xmlBody);

    let url = 'GES_PLA_WS_D1/GES_PLA_WS.asmx';
    if (this.is_prod) {
      url = 'ges_pla_ws_sarea/ges_pla_ws.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | ConfirmarRecarga | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['OP_ConfirmarRecargaResponse'];
    return { response: cvuResponseJson, ref: ref };
  }

  public static async WS_ConfOper(transaction: Transaction): Promise<{ response; ref }> {
    winston.debug('CVU | WS_ConfOper.');
    const envelope = builder.create('Envelope');
    envelope.attribute('xmlns', 'http://schemas.xmlsoap.org/soap/envelope/');

    envelope.ele('Header');

    const body = envelope.ele('Body');
    const operacion = body.ele('WS_ConfOper');
    operacion.attribute('xmlns', 'http://tempuri.org/');

    const tag = transaction.theoricTag || transaction.finalTag;
    let ref;

    if (transaction.type == 'ASSIGN_TAG') {
      ref = `TOT-AT-${transaction.id}-${tag.rollId}-${tag.id}`;
    } else if (transaction.type == 'ADD_VEHICLE') {
      ref = `TOT-NV-${transaction.id}-${tag.rollId}-${tag.id}`;
    } else if (transaction.type == 'NEW_CLIENT') {
      ref = `TOT-NC-${transaction.id}-${tag.rollId}-${tag.id}`;
    } else {
      winston.error('CVU | WS_ConfOper | ERROR: UNKNOWN TRANSACTION TYPE.');
      throw new Error('CVU | WS_ConfOper | ERROR: UNKNOWN TRANSACTION TYPE.');
    }

    transaction.opExternalId = ref;
    operacion.ele('AuxRef', ref);
    operacion.ele('AuxTag', tag.code);
    operacion.ele('AuxUsuWS', this.username);
    operacion.ele('AuxPassUsuWS', this.password);
    operacion.ele('AuxSector', transaction.totemId);
    operacion.ele('AuxTerminal', transaction.totemId);
    operacion.ele('AuxObservacion', '');

    const xmlBody = envelope.end({
      pretty: true,
    });

    winston.debug('CVU | WS_ConfOper | xml\n%s', xmlBody);

    let url = 'WS_CVU_T2/WS_CVU.asmx';
    if (this.is_prod) {
      url = 'WS_CVU_SAREA/WS_CVU.asmx';
    }

    const cvuResponse = await this.request(xmlBody, url, transaction.id);
    winston.debug('CVU | WS_ConfOper | cvu response\n%s', cvuResponse);

    const cvuResponseJson = xmlParser.parse(cvuResponse, { parseNodeValue: false })['soap:Envelope']['soap:Body']['WS_ConfOperResponse'];
    return { response: cvuResponseJson, ref: ref };
  }
}
