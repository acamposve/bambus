import { Tag } from 'src/tags/entities/tag.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user', { schema: 'totems' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('datetime', { name: 'createdOn' })
  createdOn: Date;

  @Column('datetime', { name: 'updatedOn' })
  updatedOn: Date;

  @Column('varchar', { name: 'name', length: 50 })
  name: string;

  @Column('enum', { name: 'docType', enum: ['1', '2', '3'] })
  docType: '1' | '2' | '3';

  @Column('varchar', { name: 'doc', length: 15 })
  doc: string;

  @Column('varchar', { name: 'telephone', nullable: true, length: 40 })
  telephone: string | null;

  @Column('varchar', { name: 'cellphone', length: 100 })
  cellphone: string;

  @Column('varchar', { name: 'email', length: 100 })
  email: string;

  @Column('varchar', { name: 'externalId', nullable: true, length: 50 })
  externalId: string | null;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Tag, (tag) => tag.assignedTo)
  tags: Tag[];
}
