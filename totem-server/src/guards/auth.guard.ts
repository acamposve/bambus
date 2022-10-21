import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { TotemsService } from 'src/totems/totems.service';
const winston = require('winston');

const Hashids = require('hashids');
const encrypter = new Hashids('gatito esponjoso');

const convert = (from, to) => (str) => Buffer.from(str, from).toString(to);
const hexToUtf8 = convert('hex', 'utf8');

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private totemsService: TotemsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    let log = true;

    if (['/totem', '/totem?summarized=1'].includes(req.url)) {
      log = false;
    }

    if (log) winston.debug('AuthGuard | Authorization: %s', req.headers['authorization']);
    if (!req.headers['authorization']) {
      throw new UnauthorizedException('Invalid Authentication');
    }

    const credentialsHex = encrypter.decodeHex(req.headers['authorization']);
    const credentialsStr = hexToUtf8(credentialsHex);
    if (log) winston.debug('AuthGuard | Decoded: %s', credentialsStr);

    const totem = await this.totemsService.findOneWhere({ hostname: credentialsStr });
    if (!totem) {
      throw new UnauthorizedException('Unknown Totem');
    }

    if (totem.outOfService) {
      throw new ServiceUnavailableException('Totem is out of service');
    }

    totem.lastOperationOn = new Date();
    await this.totemsService.save(totem);
    req.totemId = totem.id;

    return true;
  }
}

@Injectable()
export class OperatorGuard implements CanActivate {
  constructor(private totemsService: TotemsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    let log = true;

    if (['/totem', '/totem?summarized=1'].includes(req.url)) {
      log = false;
    }

    if (log) winston.debug('OperatorGuard | Authorization: %s', req.headers['authorization']);

    if (!req.headers['authorization']) {
      throw new UnauthorizedException('Invalid Authentication');
    }

    const credentialsHex = encrypter.decodeHex(req.headers['authorization']);
    const credentialsStr = hexToUtf8(credentialsHex);

    if (log) winston.debug('OperatorGuard | Decoded: %s', credentialsStr);
    const totem = await this.totemsService.findOneWhere({ hostname: credentialsStr });
    if (!totem) {
      throw new UnauthorizedException('Unknown Totem');
    }

    if (!req.headers['x-totem-credentials'] || !req.headers['x-totem-credentials'].length) {
      throw new UnauthorizedException('Missing totem credentials');
    }

    if (req.headers['x-totem-credentials'] != totem.operatorPassword) {
      throw new UnauthorizedException("Totem credentials don't match");
    }

    req.totemId = totem.id;

    return true;
  }
}

@Injectable()
export class TotemGuard implements CanActivate {
  constructor(private totemsService: TotemsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    let log = true;

    if (['/totem', '/totem?summarized=1'].includes(req.url)) {
      log = false;
    }

    if (log) winston.debug('TotemGuard | Authorization: %s', req.headers['authorization']);
    if (!req.headers['authorization']) {
      throw new UnauthorizedException('Invalid Authentication');
    }

    const credentialsHex = encrypter.decodeHex(req.headers['authorization']);
    const credentialsStr = hexToUtf8(credentialsHex);
    if (log) winston.debug('TotemGuard | Decoded: %s', credentialsStr);

    const totem = await this.totemsService.findOneWhere({ hostname: credentialsStr });
    if (!totem) {
      throw new UnauthorizedException('Unknown Totem');
    }

    req.totemId = totem.id;
    return true;
  }
}
