import {
  Controller, Get, Post, Delete, Param, UseGuards, Req,
  UseInterceptors, UploadedFile, Body, BadRequestException, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';

const UPLOADS_BASE = process.env.UPLOADS_DIR || '/tmp/makerpay-uploads';

const memStorage = require('multer').memoryStorage;

// ─── Public file serving (no auth) ──────────────────────────────────────────
@Controller('storage/serve')
export class StorageServeController {
  @Get(':userId/:filename')
  serveFile(@Param('userId') userId: string, @Param('filename') filename: string, @Res() res: Response) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = join(UPLOADS_BASE, userId, safeName);
    if (!existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
    return createReadStream(filePath).pipe(res as any);
  }
}

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private service: StorageService) {}

  // ─── Supabase cloud storage ──────────────────────────────────────────

  @Get('stats')
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.id);
  }

  @Get('files')
  getFiles(@Req() req: any) {
    return this.service.getFiles(req.user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memStorage(), limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadFile(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(req.user.id, file);
  }

  @Delete('files/:id')
  deleteFile(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteFile(req.user.id, id);
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
