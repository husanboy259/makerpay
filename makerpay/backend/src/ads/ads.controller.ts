import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Ad, AdPosition } from './ad.entity';

@ApiTags('ads')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  // ─── Public ───────────────────────────────────────────────────────────────

  @Get('active')
  @ApiOperation({ summary: 'Get all active ads (for payment page)' })
  async getActive() {
    return this.adsService.findActive();
  }

  @Get('active/:position')
  @ApiOperation({ summary: 'Get active ads by position' })
  async getByPosition(@Param('position') position: AdPosition) {
    return this.adsService.findByPosition(position);
  }

  @Post(':id/click')
  @ApiOperation({ summary: 'Track ad click' })
  async trackClick(@Param('id') id: string) {
    await this.adsService.trackClick(id);
    return { ok: true };
  }

  @Post(':id/impression')
  @ApiOperation({ summary: 'Track ad impression' })
  async trackImpression(@Param('id') id: string) {
    await this.adsService.trackImpression(id);
    return { ok: true };
  }

  // ─── Admin only ───────────────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all ads (admin)' })
  async findAll() {
    return this.adsService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ad statistics (admin)' })
  async getStats() {
    return this.adsService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ad by id (admin)' })
  async findOne(@Param('id') id: string) {
    return this.adsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create ad (admin)' })
  async create(@Body() body: Partial<Ad>) {
    return this.adsService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ad (admin)' })
  async update(@Param('id') id: string, @Body() body: Partial<Ad>) {
    return this.adsService.update(id, body);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle ad active status (admin)' })
  async toggle(@Param('id') id: string) {
    const ad = await this.adsService.findOne(id);
    return this.adsService.update(id, { isActive: !ad.isActive });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ad (admin)' })
  async remove(@Param('id') id: string) {
    return this.adsService.remove(id);
  }
}
