import { config } from './app.config';
import { CustomLogger } from './app.logger';
import { Payment } from './payments/entities/payment.entity';
import { CvuLog } from './plugins/cvu/calls/cvuLog.entity';
import { RechargeAmounts } from './plugins/cvu/entities/rechargeAmount.entity';
import { SareaLog } from './plugins/sarea/calls/sareaLog.entity';
import { Refund } from './refunds/entities/refund.entity';
import { Roll } from './rolls/entities/roll.entity';
import { Tag } from './tags/entities/tag.entity';
import { Totem } from './totems/entities/totem.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { User } from './users/entities/user.entity';

export default {
  type: 'mariadb',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.pass,
  charset: 'utf8mb4_unicode_ci',
  entities: [Payment, Transaction, User, RechargeAmounts, Refund, Tag, Roll, Totem, CvuLog, SareaLog],
  database: 'totems',
  //  synchronize: true
  logging: true,
  logger: new CustomLogger(),
};
