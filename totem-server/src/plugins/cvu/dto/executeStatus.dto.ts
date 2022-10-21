import { IsInt } from 'class-validator';

export class CvuExecuteStatusDto {
  @IsInt()
  transactionId: number;
}
