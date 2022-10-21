import { Tag } from 'src/tags/entities/tag.entity';
import { Totem } from 'src/totems/entities/totem.entity';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Index('FK_roll_lastTagUsedId', ['lastTagUsedId'], { unique: true })
@Entity('roll', { schema: 'totems' })
export class Roll {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'name', length: 100 })
  name: string;

  @Column('enum', {
    name: 'status',
    enum: ['FREE', 'INSTALLED', 'REMOVED'],
    default: () => "'FREE'",
  })
  status: 'FREE' | 'INSTALLED' | 'REMOVED';

  @Column('int', { name: 'lastTagUsedId', nullable: true, unique: true })
  lastTagUsedId: number | null;

  @Column('datetime', { name: 'lastTagUsedOn', nullable: true })
  lastTagUsedOn: Date | null;

  @Column('int', { name: 'sequencePosition', nullable: true })
  sequencePosition: number | null;

  @Column('int', { name: 'qty' })
  qty: number;

  @OneToMany(() => Tag, (tag) => tag.roll)
  tags: Tag[];

  @OneToMany(() => Totem, (totem) => totem.roll)
  totems: Totem[];
}
