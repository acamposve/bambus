import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('CvuLog_FK', ['transactionId'], {})
@Entity('CvuLog', { schema: 'totems' })
export class CvuLog {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('datetime', { name: 'date', nullable: true })
  date: Date | null;

  @Column('varchar', { name: 'url', nullable: true, length: 200 })
  url: string | null;

  @Column('varchar', { name: 'method', nullable: true, length: 50 })
  method: string | null;

  @Column('text', { name: 'body', nullable: true })
  body: string | null;

  @Column('text', { name: 'response', nullable: true })
  response: string | null;

  @Column('int', { name: 'responseStatus', nullable: true })
  responseStatus: number | null;

  @Column('int', { name: 'transactionId', nullable: true })
  transactionId: number | null;
}
