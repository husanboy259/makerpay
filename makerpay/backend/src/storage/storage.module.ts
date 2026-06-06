import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageFile } from './storage-file.entity';
import { StorageBucket } from './storage-bucket.entity';
import { StorageBucketToken } from './storage-bucket-token.entity';
import { StorageService } from './storage.service';
import { StorageController, StorageServeController, StorageBucketPublicController } from './storage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StorageFile, StorageBucket, StorageBucketToken])],
  providers: [StorageService],
  controllers: [StorageController, StorageServeController, StorageBucketPublicController],
})
export class StorageModule {}
