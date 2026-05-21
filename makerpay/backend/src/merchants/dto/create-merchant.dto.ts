import { IsString, IsOptional, IsUrl, IsEmail, IsInt, IsDateString } from 'class-validator';

export class CreateMerchantDto {
  @IsOptional() @IsString()
  businessName?: string;

  @IsOptional() @IsString()
  businessType?: string;

  @IsOptional() @IsString()
  inn?: string;

  @IsOptional() @IsString()
  legalAddress?: string;

  @IsOptional() @IsString()
  actualAddress?: string;

  @IsOptional() @IsString()
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

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsDateString()
  foundedAt?: string;

  @IsOptional() @IsInt()
  employeeCount?: number;

  @IsOptional() @IsString()
  instagramUrl?: string;

  @IsOptional() @IsString()
  linkedinUrl?: string;

  @IsOptional() @IsString()
  twitterUrl?: string;
}
