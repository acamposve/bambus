import { config } from 'src/app.config';

const winston = require('winston');
const request = require('request');

type Email = {
  subject: string;
  from: string;
  to: string;
  body: string;
  type: 'PRIVATE' | 'PUBLIC';
  attachments?: [];
  cc?: string;
};

const ngage = {
  send: null,
};

ngage.send = (data: Email) => {
  const body = {
    to: data.to,
    source: data.from,
    subject: data.subject,
    htmlBody: data.body,
    campaignId: config.ngage.campaignId,
    attachments: data.attachments,
    bcc: 'desarrollo@tingelmar.com',
    cc: data.cc,
  };

  console.log(body);

  return new Promise((resolve, reject) => {
    request.post(
      {
        url: data.type == 'PRIVATE' ? `${config.ngage.host}/sender/send` : `${config.ngage.host}/sender/sendprivate`,
        json: true,
        body: body,
      },
      (err, httpResponse) => {
        if (err) {
          winston.debug('ngage | send | Error. %o', err);
          return reject(err);
        }

        if (!httpResponse || ![200, 201, 202].includes(httpResponse.body.meta.code)) {
          winston.error('ngage | send (%o -> %o) | Error (server replied). %o', body.source, body.to, body);
          return reject(body);
        }

        winston.info('ngage | send (%o -> %o) | Success.', body.source, body.to);
        resolve(body);
      },
    );
  });
};

module.exports = ngage;
