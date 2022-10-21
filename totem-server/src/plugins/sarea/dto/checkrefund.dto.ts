import { IsNotEmpty, IsNumber } from 'class-validator';

export class SareaCheckRefundDto {
  @IsNumber()
  @IsNotEmpty()
  paymentId: number;
}
