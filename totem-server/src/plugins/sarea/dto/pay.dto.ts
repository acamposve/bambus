import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

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

class Vehicle {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  plateNumber: string;
}

export class SareaPayDto {
  amount: Amount;
  user: User;
  operation: 'NEW_CLIENT' | 'ADD_VEHICLE' | 'ASSIGN_TAG' | 'RECHARGE';

  @IsNotEmpty()
  @IsNumber()
  transactionId: number;

  @IsOptional()
  vehicle?: Vehicle;
}
