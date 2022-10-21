import { Roll } from 'src/rolls/entities/roll.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Index('tag_FK', ['rollId'], {})
@Index('tag_FK_1', ['assignedToId'], {})
@Entity('tag', { schema: 'totems' })
export class Tag {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'code', length: 50 })
  code: string;

  @Column('enum', { name: 'status', enum: ['FREE', 'INVALID', 'ASSIGNED'] })
  status: 'FREE' | 'INVALID' | 'ASSIGNED';

  @Column('datetime', { name: 'createdOn', default: () => 'CURRENT_TIMESTAMP' })
  createdOn: Date;

  @Column('datetime', { name: 'assignedOn', nullable: true })
  assignedOn: Date | null;

  @Column('int', { name: 'sequence' })
  sequence: number;

  @Column('int', { name: 'assignedToId', nullable: true })
  assignedToId: number | null;

  @Column('int', { name: 'rollId', nullable: true })
  rollId: number | null;

  @OneToMany(() => Transaction, (transaction) => transaction.theoricTag)
  transactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.finalTag)
  transactions2: Transaction[];

  @ManyToOne(() => Roll, (roll) => roll.tags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'rollId', referencedColumnName: 'id' }])
  roll: Roll;

  @ManyToOne(() => User, (user) => user.tags, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn([{ name: 'assignedToId', referencedColumnName: 'id' }])
  assignedTo: User;
}
