import { IsInt, IsNotEmpty } from 'class-validator';

export class CvuConfirmRechargeDto {
  @IsInt()
  @IsNotEmpty()
  transactionId: number;
}
