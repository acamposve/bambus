import { Refund } from 'src/refunds/entities/refund.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Index('payment_FK', ['transactionId'], {})
@Entity('payment', { schema: 'totems' })
export class Payment {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('datetime', { name: 'startedOn', nullable: true })
  startedOn: Date | null;

  @Column('datetime', { name: 'finishedOn', nullable: true })
  finishedOn: Date | null;

  @Column('int', { name: 'transactionId', nullable: true })
  transactionId: number | null;

  @Column('varchar', { name: 'sucursalNum', length: 20 })
  sucursalNum: string;

  @Column('varchar', { name: 'subagenciaNum', length: 20 })
  subagenciaNum: string;

  @Column('varchar', { name: 'terminalNum', length: 20 })
  terminalNum: string;

  @Column('varchar', { name: 'posNum', length: 20 })
  posNum: string;

  @Column('decimal', { name: 'amount', precision: 9, scale: 2 })
  amount: string;

  @Column('decimal', { name: 'amountDiscount', precision: 9, scale: 2 })
  amountDiscount: string;

  @Column('enum', {
    name: 'status',
    enum: ['PAYING', 'TIMED_OUT', 'ERROR', 'PAID', 'REFUNDED', 'REFUNDING'],
  })
  status: 'PAYING' | 'TIMED_OUT' | 'ERROR' | 'PAID' | 'REFUNDED' | 'REFUNDING';

  @Column('varchar', { name: 'statusDesc', nullable: true, length: 255 })
  statusDesc: string | null;

  @Column('varchar', { name: 'trxPostCode', nullable: true, length: 2 })
  trxPostCode: string | null;

  @Column('varchar', { name: 'trxPostData', nullable: true, length: 100 })
  trxPostData: string | null;

  @Column('text', { name: 'token', nullable: true })
  token: string | null;

  @Column('int', { name: 'timeout', nullable: true })
  timeout: number | null;

  @Column('varchar', { name: 'trxConsCodeIssuer', nullable: true, length: 2 })
  trxConsCodeIssuer: string | null;

  @Column('varchar', { name: 'trxConsCode', nullable: true, length: 2 })
  trxConsCode: string | null;

  @Column('varchar', {
    name: 'trxConsCodeIssuerAuthCode',
    nullable: true,
    length: 20,
  })
  trxConsCodeIssuerAuthCode: string | null;

  @Column('varchar', { name: 'trxConsTicket', nullable: true, length: 30 })
  trxConsTicket: string | null;

  @Column('text', { name: 'trxConsVoucher', nullable: true })
  trxConsVoucher: string | null;

  @Column('varchar', { name: 'trxConsAdquirente', nullable: true, length: 30 })
  trxConsAdquirente: string | null;

  @ManyToOne(() => Transaction, (transaction) => transaction.payments, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'transactionId', referencedColumnName: 'id' }])
  transaction: Transaction;

  @OneToOne(() => Refund, (refund) => refund.payment)
  refund: Refund;
}
