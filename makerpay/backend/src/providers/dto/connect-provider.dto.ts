import { IsString, IsBoolean, IsOptional, IsIn, IsUrl } from 'class-validator';

export class ConnectProviderDto {
  @IsIn(['tspay', 'paynest', 'tulovpay'])
  providerName: string;

  @IsString()
  apiKey: string;

  @IsString()
  secretKey: string;

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
