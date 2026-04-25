import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() telegramUsername?: string;
  @IsOptional() @IsString() preferredLanguage?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsBoolean() notificationEmail?: boolean;
  @IsOptional() @IsBoolean() notificationTelegram?: boolean;
}
