import { IsInt, IsNotEmpty } from 'class-validator';

class Vehicle {
  brand: { id: number; name: string };
  model: { id: number; name: string };
  color: { id: number; name: string };
  plateNumber: string;
}

export class CvuConfirmDto {
  @IsInt()
  @IsNotEmpty()
  transactionId: number;

  @IsNotEmpty()
  vehicle: Vehicle;
}
