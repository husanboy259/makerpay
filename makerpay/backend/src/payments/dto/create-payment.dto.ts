import {
  IsNumber,
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  Min,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({ example: 'UZS', required: false })
  @IsOptional()
  @IsIn(['UZS', 'USD'])
  currency?: string;

  @ApiProperty({ example: 'ORDER-123', required: false })
  @IsOptional()
  @IsString()
  externalOrderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsIn(['tspay', 'paynest', 'tulovpay'])
  providerName?: string;

  @ApiProperty({ example: 'Order payment', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  callbackUrl?: string;

  @ApiProperty({ example: 'Sardor Aliyev', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'sardor@example.com', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
