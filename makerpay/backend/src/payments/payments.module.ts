import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController, PaymentsPublicController, PaymentsApiController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { ApiKey } from '../providers/entities/api-key.entity';
import { ProvidersModule } from '../providers/providers.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Merchant, ApiKey]),
    ProvidersModule,
    WebhooksModule,
  ],
  controllers: [PaymentsController, PaymentsPublicController, PaymentsApiController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
