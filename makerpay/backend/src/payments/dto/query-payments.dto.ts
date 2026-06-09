import { IsOptional, IsString, IsNumber, IsDateString, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: string }) => (value === '' ? undefined : value);

export class QueryPaymentsDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'])
  status?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsIn(['tspay', 'paynest', 'tulovpay', 'mirpay', 'qulaypay', 'inpay', 'smartpay'])
  providerName?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
