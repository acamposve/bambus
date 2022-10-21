import { IsNotEmpty, IsString } from 'class-validator';

export class ExtendedTagManualDto {
  @IsString()
  @IsNotEmpty()
  tagCode: string;
}
