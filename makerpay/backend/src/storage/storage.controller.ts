import {
  Controller, Get, Post, Patch, Delete, Param, UseGuards, Req,
  UseInterceptors, UploadedFile, Body, BadRequestException, Res, Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';

const UPLOADS_BASE = process.env.UPLOADS_DIR || '/tmp/makerpay-uploads';

const memStorage = require('multer').memoryStorage;

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  pdf: 'application/pdf', txt: 'text/plain',
  mp4: 'video/mp4', mp3: 'audio/mpeg',
  zip: 'application/zip', json: 'application/json',
  apk: 'application/vnd.android.package-archive',
};

// ─── Public file serving (no auth) ──────────────────────────────────────────
@Controller('storage/serve')
export class StorageServeController {
  @Get(':userId/:filename')
  serveFile(@Param('userId') userId: string, @Param('filename') filename: string, @Res() res: Response) {
    const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, '_');
    const filePath = join(UPLOADS_BASE, userId, safeName);
    if (!existsSync(filePath)) return (res as any).status(404).json({ message: 'File not found' });

    const ext = safeName.split('.').pop()?.toLowerCase() || '';
    (res as any).setHeader('Content-Type', MIME_MAP[ext] || 'application/octet-stream');
    (res as any).setHeader('Cache-Control', 'public, max-age=31536000');
    return createReadStream(filePath).pipe(res as any);
  }
}

// ─── Public bucket file serving + API key upload (no JWT) ───────────────────
@Controller('storage/b')
export class StorageBucketPublicController {
  constructor(private service: StorageService) {}

  @Get(':slug/:filename')
  async serveFile(@Param('slug') slug: string, @Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = await this.service.getBucketFilePath(slug, filename);
      if (!existsSync(filePath)) return (res as any).status(404).json({ message: 'File not found' });
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      (res as any).setHeader('Content-Type', MIME_MAP[ext] || 'application/octet-stream');
      (res as any).setHeader('Cache-Control', 'public, max-age=31536000');
      return createReadStream(filePath).pipe(res as any);
    } catch {
      return (res as any).status(404).json({ message: 'File not found' });
    }
  }

  @Post(':slug/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memStorage(), limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadToBucket(
    @Param('slug') slug: string,
    @Headers('x-storage-key') apiKey: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!apiKey) throw new BadRequestException('X-Storage-Key header kerak');
    if (!file) throw new BadRequestException('Fayl kerak');
    return this.service.uploadToBucket(slug, apiKey, file);
  }
}

// ─── JWT-protected storage endpoints ─────────────────────────────────────────
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private service: StorageService) {}

  // ─── Personal storage ────────────────────────────────────────────────

  @Get('stats')
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.id);
  }

  @Get('files')
  getFiles(@Req() req: any) {
    return this.service.getFiles(req.user.id);
  }

  @Post('upload')
  @Throttle({ short: { ttl: 1000, limit: 50 } })
  @UseInterceptors(FileInterceptor('file', { storage: memStorage(), limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadFile(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(req.user.id, file);
  }

  @Delete('files/:id')
  deleteFile(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteFile(req.user.id, id);
  }

  // ─── Buckets ─────────────────────────────────────────────────────────

  @Post('buckets')
  async createBucket(@Req() req: any, @Body('name') name: string) {
    return this.service.createBucket(req.user.id, name);
  }

  @Get('buckets')
  async listBuckets(@Req() req: any) {
    return this.service.getBuckets(req.user.id);
  }

  @Delete('buckets/:id')
  async deleteBucket(@Req() req: any, @Param('id') id: string) {
    await this.service.deleteBucket(req.user.id, id);
    return { message: 'Bucket o\'chirildi' };
  }

  @Post('buckets/:id/regenerate')
  async regenerateKey(@Req() req: any, @Param('id') id: string) {
    return this.service.regenerateBucketKey(req.user.id, id);
  }

  @Post('buckets/:id/tokens')
  async addBucketToken(@Req() req: any, @Param('id') id: string, @Body('name') name: string) {
    if (!name?.trim()) throw new BadRequestException('Token nomi kerak');
    return this.service.addBucketToken(req.user.id, id, name.trim());
  }

  @Get('buckets/:id/tokens')
  async listBucketTokens(@Req() req: any, @Param('id') id: string) {
    return this.service.listBucketTokens(req.user.id, id);
  }

  @Delete('buckets/:id/tokens/:tokenId')
  async deleteBucketToken(@Req() req: any, @Param('id') id: string, @Param('tokenId') tokenId: string) {
    await this.service.deleteBucketToken(req.user.id, id, tokenId);
    return { message: 'Token o\'chirildi' };
  }

  @Patch('buckets/:id/domain')
  async updateDomain(@Req() req: any, @Param('id') id: string, @Body('customDomain') customDomain: string) {
    return this.service.updateBucketDomain(req.user.id, id, customDomain || null);
  }

  // ─── Local workspace (deploy / terminal) ────────────────────────────

  @Get('workspace')
  getLocalFiles(@Req() req: any) {
    return this.service.getLocalFiles(req.user.id);
  }

  @Post('workspace/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memStorage(), limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadLocalFile(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.service.uploadLocalFile(req.user.id, file);
  }

  @Post('workspace/upload-zip')
  @UseInterceptors(FileInterceptor('file', { storage: memStorage(), limits: { fileSize: 100 * 1024 * 1024 } }))
  uploadZip(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No ZIP file provided');
    return this.service.uploadLocalZip(req.user.id, file);
  }

  @Post('workspace/exec')
  async execCommand(@Req() req: any, @Body() body: { command: string }) {
    if (!body?.command?.trim()) throw new BadRequestException('Command is required');
    return this.service.executeCommand(req.user.id, body.command);
  }

  @Delete('workspace/files')
  async deleteWorkspaceFile(@Req() req: any, @Body() body: { path: string }) {
    if (!body?.path) throw new BadRequestException('Path is required');
    return this.service.deleteLocalFile(req.user.id, body.path);
  }
}
