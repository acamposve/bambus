import { Payment } from 'src/payments/entities/payment.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { Totem } from 'src/totems/entities/totem.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Index('transaction_FK_2', ['theoricTagId'], {})
@Index('transaction_FK_1', ['totemId'], {})
@Index('transaction_FK', ['userId'], {})
@Index('transaction_FK_3', ['finalTagId'], {})
@Entity('transaction', { schema: 'totems' })
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('datetime', { name: 'createdOn' })
  createdOn: Date;

  @Column('datetime', { name: 'updatedOn' })
  updatedOn: Date;

  @Column('enum', {
    name: 'type',
    enum: ['NEW_CLIENT', 'ADD_VEHICLE', 'ASSIGN_TAG', 'RECHARGE'],
  })
  type: 'NEW_CLIENT' | 'ADD_VEHICLE' | 'ASSIGN_TAG' | 'RECHARGE';

  @Column('decimal', { name: 'amount', precision: 8, scale: 2 })
  amount: string;

  @Column('int', { name: 'userId', nullable: true })
  userId: number | null;

  @Column('enum', {
    name: 'status',
    enum: ['PAYING', 'PAID', 'PROCESSING', 'ERROR', 'COMPLETED', 'EXECUTED', 'REVERSED', 'ERROR_REVERSED', 'PLACEHOLDER', 'ERROR_PAYMENT', 'ERROR_TAG', 'ERROR_CANCELED', 'CANCELED'],
  })
  status: 'PAYING' | 'PAID' | 'PROCESSING' | 'ERROR' | 'COMPLETED' | 'EXECUTED' | 'REVERSED' | 'ERROR_REVERSED' | 'PLACEHOLDER' | 'ERROR_PAYMENT' | 'ERROR_TAG' | 'CANCELED' | 'ERROR_CANCELED';

  @Column('text', { name: 'data', nullable: true })
  data: string | null;

  @Column('varchar', { name: 'errorCode', nullable: true, length: 20 })
  errorCode: string | null;

  @Column('varchar', { name: 'errorDesc', nullable: true, length: 255 })
  errorDesc: string | null;

  @Column('varchar', { name: 'nroFactura', nullable: true, length: 20 })
  nroFactura: string | null;

  @Column('varchar', { name: 'serieFactura', nullable: true, length: 20 })
  serieFactura: string | null;

  @Column('int', { name: 'totemId', nullable: true })
  totemId: number | null;

  @Column('int', { name: 'theoricTagId', nullable: true })
  theoricTagId: number | null;

  @Column('int', { name: 'finalTagId', nullable: true })
  finalTagId: number | null;

  @Column('varchar', { name: 'opExternalId', nullable: true, length: 100 })
  opExternalId: string | null;

  @Column('varchar', { name: 'rcExternalId', nullable: true, length: 100 })
  rcExternalId: string | null;

  @ManyToOne(() => User, (user) => user.transactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
    cascade: ['insert', 'update'],
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;

  @ManyToOne(() => Totem, (totem) => totem.transactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
    cascade: ['insert', 'update'],
  })
  @JoinColumn([{ name: 'totemId', referencedColumnName: 'id' }])
  totem: Totem;

  @ManyToOne(() => Tag, (tag) => tag.transactions, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
    cascade: ['insert', 'update'],
  })
  @JoinColumn([{ name: 'theoricTagId', referencedColumnName: 'id' }])
  theoricTag: Tag;

  @ManyToOne(() => Tag, (tag) => tag.transactions2, {
    onDelete: 'RESTRICT',
    cascade: ['insert', 'update'],
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'finalTagId', referencedColumnName: 'id' }])
  finalTag: Tag;

  @OneToMany(() => Payment, (payment) => payment.transaction)
  payments: Payment[];
}
