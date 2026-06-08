import { IsNumber, IsString, IsOptional, IsUrl, Min } from 'class-validator';

export class CreatePaymentPublicDto {
  @IsNumber()
  @Min(1000)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  failUrl?: string;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
