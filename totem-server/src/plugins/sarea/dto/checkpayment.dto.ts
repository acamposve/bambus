import { IsNotEmpty, IsNumber } from 'class-validator';

export class SareaCheckPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  paymentId: number;

  @IsNumber()
  @IsNotEmpty()
  transactionId: number;
}
