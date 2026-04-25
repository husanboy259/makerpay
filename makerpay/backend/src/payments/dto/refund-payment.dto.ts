import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
