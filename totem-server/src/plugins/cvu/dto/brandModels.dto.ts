import { IsNotEmpty, IsString } from 'class-validator';

export class CvuBrandModelsDto {
  @IsString()
  @IsNotEmpty()
  brand: string;
}
