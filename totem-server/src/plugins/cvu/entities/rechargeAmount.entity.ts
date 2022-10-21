import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rechargeAmounts', { schema: 'totems' })
export class RechargeAmounts {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('decimal', { name: 'amount', precision: 9, scale: 2 })
  amount: string;

  @Column('tinyint', { name: 'includesTaxes', width: 1, default: () => "'1'" })
  includesTaxes: boolean;

  @Column('int', { name: 'tollGoThroughs', default: () => "'1'" })
  tollGoThroughs: number;
}
