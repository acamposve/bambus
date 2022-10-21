import { Roll } from 'src/rolls/entities/roll.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Index('IDX_totem_lastTransId', ['lastTransactionId'], { unique: true })
@Index('IDX_totem_rollId', ['rollId'], {})
@Entity('totem', { schema: 'totems' })
export class Totem {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'name', nullable: true, length: 20 })
  name: string | null;

  @Column('datetime', {
    name: 'lastOperationOn',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastOperationOn: Date | null;

  @Column('varchar', { name: 'password', nullable: true, length: 255 })
  password: string | null;

  @Column('tinyint', {
    name: 'outOfService',
    nullable: true,
    width: 1,
    default: () => "'0'",
  })
  outOfService: boolean | null;

  @Column('enum', {
    name: 'outOfServiceCause',
    nullable: true,
    enum: ['FAILURE', 'OUT_OF_TAGS', 'MANUAL'],
  })
  outOfServiceCause: 'FAILURE' | 'OUT_OF_TAGS' | 'MANUAL' | null;

  @Column('datetime', { name: 'outOfServiceOn', nullable: true })
  outOfServiceOn: Date | null;

  @Column('int', { name: 'lastTransactionId', nullable: true, unique: true })
  lastTransactionId: number | null;

  @Column('int', { name: 'rollId', nullable: true })
  rollId: number | null;

  @Column('varchar', { name: 'operatorPassword', nullable: true, length: 255 })
  operatorPassword: string | null;

  @Column('varchar', { name: 'hostname', length: 100 })
  hostname: string;

  @Column('varchar', { name: 'posTerminalId', length: 255 })
  posTerminalId: string;

  @Column('varchar', { name: 'latlng', length: 255 })
  latlng: string;

  @OneToMany(() => Transaction, (transaction) => transaction.totem)
  transactions: Transaction[];

  @ManyToOne(() => Roll, (roll) => roll.totems, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'rollId', referencedColumnName: 'id' }])
  roll: Roll;
}
