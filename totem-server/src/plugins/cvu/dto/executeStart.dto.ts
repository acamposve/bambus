import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

class Vehicle {
  brand: { id: number; name: string };
  model: { id: number; name: string };
  color: { id: number; name: string };
  plateNumber: string;
}

class Amount {
  @IsNumber()
  @Min(0)
  amount: string;
}

class User {
  @IsOptional()
  @IsInt()
  id: number;

  @IsInt()
  @Min(1)
  @Max(3)
  docType: '1' | '2' | '3';

  @IsString()
  @IsNotEmpty()
  docValue: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cel: string;
}

export class CvuExecuteStartDto {
  @IsInt()
  @IsNotEmpty()
  transactionId: number;

  @IsOptional()
  vehicle: Vehicle;

  @IsNotEmpty()
  amount: Amount;

  @IsOptional()
  clientNumber: string;

  @IsOptional()
  user: User;
}
