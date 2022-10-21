import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import * as soporte from 'tingelmar-support';
import * as winston from 'winston';
import * as pkg from '../package.json';
import { config } from './app.config';
import { AppModule } from './app.module';
import { CVU } from './plugins/cvu/cvu.connector';
import { Sarea } from './plugins/sarea/sarea.connector';
import { reportError } from './utils';

async function bootstrap() {
  soporte.env = 'prod'; // config.env;
  soporte.silent = true;
  soporte.author = `[${config.env}] Totem Server (${pkg.version})`;
  soporte.username = `Totem [${config.env.toUpperCase()}]`;

  if (config.env == 'stg') {
    soporte.url = 'https://discord.com/api/webhooks/862737258472931338/Z1UE5pzZog9zOhRGk7m4lvRNRMl3GyOKeAPEocG6OsytTSpe3yLluGu671BPh3p_qBtr';
  } else {
    soporte.url = 'https://discord.com/api/webhooks/862740052773830717/3bt-eFy87DX2yVLzYeP-6jf1caXw9pGLjnjBAa2pG36n4EwumgGdZHMPhAc_X40n6DXz';
    Sentry.init({
      dsn: 'https://e0e61d9c225844a9a73ff56c97c58a66@o921732.ingest.sentry.io/5868415',
      tracesSampleRate: 1.0,
      debug: true,
    });
  }

  winston.configure({
    level: 'silly',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'DD/MM/YYYY HH:mm:ss',
      }),
      winston.format.splat(),
      winston.format.json(),
      winston.format.printf((info) => {
        if (info.message.constructor != String) {
          info.message = JSON.stringify(info.message);
        }
        if (info.message.includes('var ')) {
          return info.message;
        }
        return `${info.timestamp} - ${info.level}: ${info.message}` + (info.splat !== undefined ? `${info.splat}` : ' ');
      }),
    ),
    transports: [
      new winston.transports.Console({ level: 'silly' }),
      new winston.transports.File({
        filename: `/var/log/bambustech/${config.env}/uy/totem-server/app.log`,
      }),
    ],
  });

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const getIP = (req): string => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  };

  app.use((req, res, next) => {
    if (!['/totem', '/totem?summarized=1'].includes(req.url)) {
      winston.silly('[%s] %s %s', getIP(req), req.method, req.url);
    }
    next();
  });

  app.enableCors();

  app.use(function (req, res, next) {
    const send = res.send;
    res.send = async function (body) {
      if (!['/totem', '/totem?summarized=1'].includes(req.url)) {
        winston.info(`Respuesta: %s`, body);
      }
      if (res.statusCode != 200 && res.statusCode != 201) {
        const error = {
          title: `Request error`,
          message: `URL: ${req.url}\nFrom: ${getIP(req)}\nUA: ${req.headers['user-agent']}`,
          stack: {
            ...JSON.parse(body),
            ip: getIP(req),
            ua: req.headers['user-agent'],
          },
        };

        reportError(error);

        res.set('Content-Type', 'application/json').status(res.statusCode);

        const bodyAux = JSON.parse(body);
        send.call(
          this,
          JSON.stringify({
            data: bodyAux.error?.toString(),
            outcode: bodyAux.statusCode?.toString(),
            message: bodyAux.message?.toString(),
          }),
        );
      } else {
        res.set('Content-Type', 'application/json').status(200);

        send.call(
          this,
          JSON.stringify({
            data: JSON.parse(body),
            outcode: res.statusCode,
            message: 'OK',
          }),
        );
      }
    };
    next();
  });

  // Init CVU class
  CVU.init();
  Sarea.init();

  await app.listen(config.port);
}
bootstrap();
