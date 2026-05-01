import { IsString, IsOptional, IsIn, IsArray, IsInt, Min, Max } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsIn(['production', 'sandbox'])
  environment?: string;

  @IsOptional()
  @IsIn(['secret', 'publishable'])
  keyType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIps?: string[];

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(10000)
  rateLimitPerMin?: number;
}
