import { IsInt } from 'class-validator';

export class CvuExpendedTagDto {
  @IsInt()
  transactionId: number;

  @IsInt()
  printQty: number;
}
