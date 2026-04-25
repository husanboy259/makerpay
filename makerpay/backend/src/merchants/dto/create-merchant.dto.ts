import { IsString, IsOptional, IsUrl, IsEmail } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  businessName: string;

  @IsOptional() @IsString()
  businessType?: string;

  @IsOptional() @IsString()
  inn?: string;

  @IsOptional() @IsString()
  legalAddress?: string;

  @IsOptional() @IsString()
  actualAddress?: string;

  @IsOptional() @IsUrl()
  websiteUrl?: string;

  @IsOptional() @IsString()
  bankName?: string;

  @IsOptional() @IsString()
  bankAccount?: string;

  @IsOptional() @IsString()
  mfo?: string;

  @IsOptional() @IsString()
  contactName?: string;

  @IsOptional() @IsEmail()
  contactEmail?: string;

  @IsOptional() @IsString()
  contactPhone?: string;

  @IsOptional() @IsString()
  telegramUsername?: string;
}
