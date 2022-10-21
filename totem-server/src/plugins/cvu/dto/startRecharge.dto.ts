import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CvuStartRechargeDto {
  @IsInt()
  @Min(1)
  @Max(3)
  userDocType: number;

  @IsString()
  @IsNotEmpty()
  userDocValue: string;
}
