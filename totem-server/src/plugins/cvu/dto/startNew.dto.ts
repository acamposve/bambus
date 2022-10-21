import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CvuStartNewDto {
  @IsInt()
  @Min(1)
  @Max(3)
  userDocType: number;

  @IsString()
  @IsNotEmpty()
  userDocValue: string;

  @IsString()
  @IsNotEmpty()
  vehiclePlateNumber: string;
}
