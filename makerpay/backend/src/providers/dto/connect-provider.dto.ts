import { IsString, IsBoolean, IsOptional, IsIn, IsUrl } from 'class-validator';

export class ConnectProviderDto {
  @IsIn(['tspay', 'qulaypay', 'inpay'])
  providerName: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  secretKey?: string;

  @IsOptional()
  @IsString()
  providerMerchantId?: string;

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  testMode?: boolean;

  @IsOptional()
  extraConfig?: Record<string, any>;
}
