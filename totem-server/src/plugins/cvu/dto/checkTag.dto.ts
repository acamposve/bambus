import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CvuCheckTagDto {
  @IsInt()
  @IsNotEmpty()
  transactionId: number;

  @IsString()
  @IsNotEmpty()
  tagCode: string;
}
