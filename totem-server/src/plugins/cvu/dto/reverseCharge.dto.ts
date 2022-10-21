import { IsInt } from 'class-validator';

export class CvuReverseChargeDto {
  @IsInt()
  transactionId: number;
}
