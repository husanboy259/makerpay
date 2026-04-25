import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Payment } from '../payments/entities/payment.entity';
import { WebhookLog } from '../webhooks/entities/webhook-log.entity';
import { MerchantProvider } from '../providers/entities/merchant-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Merchant, Payment, WebhookLog, MerchantProvider])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
