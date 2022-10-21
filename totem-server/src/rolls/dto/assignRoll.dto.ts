import { IsNotEmpty, IsNumber } from 'class-validator';

export class AssignRollDto {
  @IsNumber()
  @IsNotEmpty()
  rollId: number;
}
