import { IsInt, IsNotEmpty } from 'class-validator';

export class SareaRefundDto {
  @IsNotEmpty()
  @IsInt()
  paymentId: number;
}
