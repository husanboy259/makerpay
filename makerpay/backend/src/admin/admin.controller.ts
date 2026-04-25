import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform dashboard stats' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('payments')
  @ApiOperation({ summary: 'All payments (admin)' })
  async getAllPayments(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('merchantId') merchantId?: string,
    @Query('providerName') providerName?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getAllPayments(+page, +limit, { status, merchantId, providerName, from, to });
  }

  @Get('users')
  @ApiOperation({ summary: 'All users (admin)' })
  async getAllUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getAllUsers(+page, +limit);
  }

  @Put('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (admin only)' })
  async updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user by id' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/ban')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ban user (admin only)' })
  async banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }

  @Patch('users/:id/unban')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Unban user (admin only)' })
  async unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Get('users/:id/logs')
  @ApiOperation({ summary: 'Get user activity logs' })
  async getUserLogs(@Param('id') id: string) {
    return this.adminService.getUserLogs(id);
  }

  @Get('errors')
  @ApiOperation({ summary: 'Failed payments log' })
  async getErrorLogs(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getErrorLogs(+page, +limit);
  }

  @Get('webhook-errors')
  @ApiOperation({ summary: 'Failed webhook delivery log' })
  async getWebhookErrors(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getWebhookErrors(+page, +limit);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Revenue chart data' })
  async getRevenueChart(@Query('days') days = 30) {
    return this.adminService.getRevenueChart(+days);
  }
}
