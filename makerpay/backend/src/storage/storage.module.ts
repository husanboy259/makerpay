import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageFile } from './storage-file.entity';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StorageFile])],
  providers: [StorageService],
  controllers: [StorageController],
})
export class StorageModule {}
