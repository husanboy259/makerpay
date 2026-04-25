import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { MerchantProvider } from './entities/merchant-provider.entity';
import { ApiKey } from './entities/api-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantProvider, ApiKey])],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService, TypeOrmModule],
})
export class ProvidersModule {}
