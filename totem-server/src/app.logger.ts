import { Logger, QueryRunner, SimpleConsoleLogger } from 'typeorm';

export class CustomLogger extends SimpleConsoleLogger implements Logger {
  constructor() {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    // winston.debug(`'%s' <-> '%s'`, query, JSON.stringify(parameters));
  }
}
