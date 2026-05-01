import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly svc: SubscriptionsService) {}

  // ─── Notifications ────────────────────────────────────────────────

  @Get('notifications')
  @ApiOperation({ summary: 'Get my notifications' })
  async getNotifications(@Req() req: any) {
    return this.svc.getNotifications(req.user.id);
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@Req() req: any) {
    const count = await this.svc.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Req() req: any, @Param('id') id: string) {
    return this.svc.markRead(id, req.user.id);
  }

  @Patch('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Req() req: any) {
    return this.svc.markAllRead(req.user.id);
  }

  // ─── Merchant ─────────────────────────────────────────────────────

  @Get('my')
  @ApiOperation({ summary: 'Get my subscription' })
  async getMy(@Req() req: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.svc.getMySubscription(merchantId);
  }

  @Post('trial/apply')
  @ApiOperation({ summary: 'Apply for TRIAL plan' })
  async applyTrial(@Req() req: any, @Body() body: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.svc.applyForTrial(req.user.id, merchantId, body);
  }

  @Get('trial/my')
  @ApiOperation({ summary: 'Get my trial application status' })
  async myTrial(@Req() req: any) {
    return this.svc.getMyTrialApplication(req.user.id);
  }

  // ─── Admin ────────────────────────────────────────────────────────

  @Get('admin/all')
  @ApiOperation({ summary: 'All subscriptions (admin)' })
  async getAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.getAllSubscriptions(+page, +limit);
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Subscription stats (admin)' })
  async getStats() {
    return this.svc.getStats();
  }

  @Get('admin/trials')
  @ApiOperation({ summary: 'All trial applications (admin)' })
  async getTrials(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.svc.getAllTrialApplications(+page, +limit, status);
  }

  @Post('admin/assign')
  @ApiOperation({ summary: 'Assign plan to merchant (admin)' })
  async assign(@Req() req: any, @Body() body: { merchantId: string; plan: string; adminNote?: string; months?: number }) {
    return this.svc.assignPlan(body.merchantId, body.plan, req.user.id, body.adminNote, body.months);
  }

  @Patch('admin/trials/:id/approve')
  @ApiOperation({ summary: 'Approve trial application' })
  async approve(@Req() req: any, @Param('id') id: string, @Body('invitationText') invitationText?: string) {
    return this.svc.approveTrialApplication(id, req.user.id, invitationText);
  }

  @Patch('admin/trials/:id/reject')
  @ApiOperation({ summary: 'Reject trial application' })
  async reject(@Req() req: any, @Param('id') id: string, @Body('adminNote') adminNote: string) {
    return this.svc.rejectTrialApplication(id, req.user.id, adminNote);
  }

  @Patch('admin/trials/:id/invite')
  @ApiOperation({ summary: 'Send invitation to startup' })
  async invite(@Req() req: any, @Param('id') id: string, @Body('invitationText') invitationText: string) {
    return this.svc.sendInvitation(id, req.user.id, invitationText);
  }
}
