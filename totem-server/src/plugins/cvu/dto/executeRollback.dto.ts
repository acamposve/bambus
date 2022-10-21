import { IsInt, IsNotEmpty } from 'class-validator';

export class CvuExecuteRollbackDto {
  @IsInt()
  @IsNotEmpty()
  transactionId: number;
}
