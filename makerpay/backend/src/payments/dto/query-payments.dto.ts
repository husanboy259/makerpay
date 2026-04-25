import { IsOptional, IsString, IsNumber, IsDateString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPaymentsDto {
  @IsOptional()
  @IsIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsIn(['tspay', 'paynest', 'tulovpay'])
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
