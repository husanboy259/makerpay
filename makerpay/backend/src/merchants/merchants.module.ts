import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { Merchant } from './entities/merchant.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant, User])],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService, TypeOrmModule],
})
export class MerchantsModule {}
