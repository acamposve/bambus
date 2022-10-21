import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roll } from 'src/rolls/entities/roll.entity';
import { RollsService } from 'src/rolls/rolls.service';
import { Tag } from 'src/tags/entities/tag.entity';
import { TagsService } from 'src/tags/tags.service';
import { reportError, reportInfo } from 'src/utils';
import { MoreThan, Repository } from 'typeorm';
import { Totem } from './entities/totem.entity';

@Injectable()
export class TotemsService {
  constructor(@InjectRepository(Totem) private repository: Repository<Totem>, private tagsService: TagsService, private rollService: RollsService) {}

  create(body: Totem) {
    return this.repository.save(body);
  }

  findOneWhere(data: any) {
    return this.repository.findOne(data);
  }

  findOne(id: number) {
    return this.repository.findOne({ id: id });
  }

  findWhere(data: any) {
    return this.repository.find(data);
  }

  save(body: Totem) {
    return this.repository.save(body);
  }

  async getNextTag(totem: Totem, reportTag = true): Promise<{ tag: Tag; printQty: number }> {
    if (!totem.rollId) {
      reportError({
        title: 'El totem no tiene un rollo asignado',
        stack: {
          totemId: totem.id,
          totemName: totem.name,
        },
      });

      throw new HttpException({ msg: 'El totem no tiene un rollo asignado' }, 500);
    }

    const current_roll: Roll = await this.rollService.findOne(totem.rollId);
    let printQty = 0;
    let nextTag = null;
    try {
      // if (current_roll.lastTagUsedId) {
      //   const currentTag: any = await this.tagsService.find({ id: current_roll.lastTagUsedId });
      // }
      nextTag = await this.tagsService.find({ rollId: current_roll.id, sequence: MoreThan(current_roll.sequencePosition), status: 'FREE' });
      printQty = current_roll.sequencePosition == 0 ? 1 : nextTag.sequence - current_roll.sequencePosition;
    } catch (err) {}

    if (!nextTag) {
      reportError({
        title: 'No se encontro un siguiente tag',
        stack: {
          totemId: totem.id,
          rollId: current_roll.id,
          sequencePosition: current_roll.sequencePosition,
        },
      });

      throw new HttpException({ msg: 'No se encontro un siguiente tag' }, 500);
    }

    if (reportTag) {
      reportInfo({
        title: `Tag teorico: ${nextTag?.id}`,
        stack: {
          totem: totem,
          roll: current_roll,
          tag: nextTag,
          printQty: printQty,
        },
      });
    }

    return { tag: nextTag, printQty: printQty };
  }
}
