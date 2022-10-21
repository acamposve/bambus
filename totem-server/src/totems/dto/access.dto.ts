import { IsNotEmpty } from 'class-validator';

export class TotemAccessDto {
  @IsNotEmpty()
  password: string;
}
