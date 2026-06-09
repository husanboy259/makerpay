import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantSubscription, TrialApplication } from './entities/subscription.entity';
import { Notification } from './entities/notification.entity';
import { SubscriptionOrder } from './entities/subscription-order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController, SubscriptionWebhookController } from './subscriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantSubscription, TrialApplication, Notification, SubscriptionOrder, Payment])],
  controllers: [SubscriptionsController, SubscriptionWebhookController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
