import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;
}

export class ReplyTicketDto {
  @IsString()
  message: string;

  @IsOptional()
  isInternal?: boolean;
}
