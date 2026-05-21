import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { exec } from 'child_process';
import { mkdir, writeFile, unlink, readdir, lstat } from 'fs/promises';
import { join, relative, basename } from 'path';
import { StorageFile } from './storage-file.entity';

const UPLOADS_BASE = process.env.UPLOADS_DIR || '/tmp/makerpay-uploads';

const FREE_QUOTA = 512 * 1024 * 1024; // 512 MB

const BLOCKED_PATTERNS = [
  /\brm\s+(-\S*[rRfF]){2,}/i,
  /\brm\s+-rf\b/i,
  /\brm\s+-fr\b/i,
  /\bsudo\b/i,
  /\bwget\b/i,
  /\bcurl\b.*https?:\/\//i,
  /chmod\s+[0-9]*7[0-9]*/,
  /\bdd\b.*\bif=/i,
  />\s*\/(etc|sys|proc|boot|root)/i,
  /\b(shutdown|reboot|poweroff|halt)\b/i,
  /\bnc\b.*-[le]/i,
  /\/etc\/(passwd|shadow|sudoers)/i,
  /\.\.\//,
  /\bkill\s+-9\s+1\b/,
  /\bmkfs\b/i,
  /\bfdisk\b/i,
];

const WORKSPACE_BASE = process.env.WORKSPACE_DIR || '/tmp/makerpay-workspaces';

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(StorageFile)
    private repo: Repository<StorageFile>,
  ) {}

  // ─── Supabase cloud storage ───────────────────────────────────────────

  async getStats(userId: string) {
    const files = await this.repo.find({ where: { userId } });
    const used = files.reduce((sum, f) => sum + Number(f.fileSize), 0);
    return {
      used,
      total: FREE_QUOTA,
      usedMB: Math.round((used / 1024 / 1024) * 100) / 100,
      totalMB: 512,
      percent: Math.round((used / FREE_QUOTA) * 100),
      fileCount: files.length,
    };
  }

  async getFiles(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async uploadFile(userId: string, file: Express.Multer.File) {
    const stats = await this.getStats(userId);
    if (stats.used + file.size > FREE_QUOTA) throw new Error('Storage quota exceeded');

    const userUploadDir = join(UPLOADS_BASE, userId);
    await mkdir(userUploadDir, { recursive: true });

    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await writeFile(join(userUploadDir, safeName), file.buffer);

    const baseUrl = process.env.BASE_URL || 'https://api.makerpay.uz';
    const fileUrl = `${baseUrl}/api/v1/storage/serve/${userId}/${safeName}`;

    const entity = this.repo.create({ userId, fileName: file.originalname, fileUrl, fileSize: file.size, mimeType: file.mimetype });
    return this.repo.save(entity);
  }

  async deleteFile(userId: string, fileId: string) {
    const file = await this.repo.findOne({ where: { id: fileId, userId } });
    if (!file) throw new Error('File not found');
    await this.repo.remove(file);
    return { message: 'Deleted' };
  }

  // ─── Local workspace (deploy / terminal) ─────────────────────────────

  private userDir(userId: string) {
    return join(WORKSPACE_BASE, userId);
  }

  async getLocalFiles(userId: string) {
    const dir = this.userDir(userId);
    await mkdir(dir, { recursive: true });
    return this.scanDir(dir, dir);
  }

  private async scanDir(dir: string, base: string): Promise<any[]> {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    const result: any[] = [];
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const full = join(dir, e.name);
      const rel = relative(base, full);
      if (e.isDirectory()) {
        result.push({ name: e.name, type: 'dir', path: rel, children: await this.scanDir(full, base) });
      } else {
        const st = await lstat(full).catch(() => null);
        result.push({ name: e.name, type: 'file', path: rel, size: st?.size || 0 });
      }
    }
    return result;
  }

  async uploadLocalFile(userId: string, file: Express.Multer.File) {
    const dir = this.userDir(userId);
    await mkdir(dir, { recursive: true });
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._\-]/g, '_');
    await writeFile(join(dir, safeName), file.buffer);
    return { name: safeName, size: file.size };
  }

  async uploadLocalZip(userId: string, file: Express.Multer.File) {
    const dir = this.userDir(userId);
    await mkdir(dir, { recursive: true });
    const tmpZip = join(dir, `__upload_${Date.now()}.zip`);
    await writeFile(tmpZip, file.buffer);

    return new Promise<{ extracted: number; message: string }>((resolve, reject) => {
      exec(`unzip -o "${tmpZip}" -d "${dir}" 2>&1`, { timeout: 60_000 }, async (err, stdout) => {
        await unlink(tmpZip).catch(() => {});
        if (err && !stdout.includes('inflating') && !stdout.includes('creating')) {
          return reject(new Error(`ZIP extraction failed: ${err.message}`));
        }
        const count = (stdout.match(/inflating:/g) || []).length + (stdout.match(/creating:/g) || []).length;
        resolve({ extracted: count, message: `${count} ta fayl chiqarildi` });
      });
    });
  }

  async deleteLocalFile(userId: string, filePath: string) {
    const dir = this.userDir(userId);
    const safePath = filePath.replace(/\.\.\//g, '').replace(/^\//, '');
    const fullPath = join(dir, safePath);
    if (!fullPath.startsWith(dir)) throw new Error('Invalid path');
    await unlink(fullPath).catch(() => {});
    return { message: 'Deleted' };
  }

  async executeCommand(userId: string, command: string) {
    const cmd = command.trim();
    if (!cmd) return { output: '', exitCode: 0 };

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(cmd)) {
        return { output: `Xato: Taqiqlangan buyruq — "${cmd.split(' ')[0]}"`, exitCode: 1, blocked: true };
      }
    }

    const dir = this.userDir(userId);
    await mkdir(dir, { recursive: true });

    return new Promise<{ output: string; exitCode: number }>((resolve) => {
      exec(cmd, {
        cwd: dir,
        timeout: 30_000,
        maxBuffer: 512 * 1024,
        env: {
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
          HOME: dir,
          NODE_PATH: '/usr/lib/node_modules',
          NODE_ENV: 'production',
        },
      }, (error, stdout, stderr) => {
        const out = [stdout, stderr ? `[stderr] ${stderr}` : ''].filter(Boolean).join('\n').slice(0, 40_000);
        resolve({ output: out, exitCode: error?.code ?? 0 });
      });
    });
  }
}
