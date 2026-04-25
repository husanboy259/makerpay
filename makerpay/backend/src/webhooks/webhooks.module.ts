import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookLog } from './entities/webhook-log.entity';
import { MerchantProvider } from '../providers/entities/merchant-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookLog, MerchantProvider])],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
