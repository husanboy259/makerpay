import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

// ── Public webhook controller (no auth) ──────────────────────────────────────
@Controller('subscriptions/webhook')
export class SubscriptionWebhookController {
  constructor(private readonly svc: SubscriptionsService) {}

  @Post(':provider')
  @HttpCode(200)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers('x-signature') sig?: string,
    @Headers('x-tspay-signature') tsSig?: string,
    @Headers('x-timestamp') timestamp?: string,
  ) {
    return this.svc.handleProviderWebhook(provider, body, sig || tsSig, timestamp);
  }
}

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

  @Get('trial/payment-info')
  @ApiOperation({ summary: 'Get verification payment details for trial' })
  trialPaymentInfo() {
    return this.svc.getTrialPaymentInfo();
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'All subscriptions (admin)' })
  async getAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.getAllSubscriptions(+page, +limit);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Subscription stats (admin)' })
  async getStats() {
    return this.svc.getStats();
  }

  @Get('admin/trials')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'All trial applications (admin)' })
  async getTrials(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.svc.getAllTrialApplications(+page, +limit, status);
  }

  @Post('admin/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign plan to merchant (admin)' })
  async assign(@Req() req: any, @Body() body: { merchantId: string; plan: string; adminNote?: string; months?: number }) {
    return this.svc.assignPlan(body.merchantId, body.plan, req.user.id, body.adminNote, body.months);
  }

  @Patch('admin/trials/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve trial application' })
  async approve(@Req() req: any, @Param('id') id: string, @Body('invitationText') invitationText?: string) {
    return this.svc.approveTrialApplication(id, req.user.id, invitationText);
  }

  @Patch('admin/trials/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reject trial application' })
  async reject(@Req() req: any, @Param('id') id: string, @Body('adminNote') adminNote: string) {
    return this.svc.rejectTrialApplication(id, req.user.id, adminNote);
  }

  @Patch('admin/trials/:id/invite')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Send invitation to startup' })
  async invite(@Req() req: any, @Param('id') id: string, @Body('invitationText') invitationText: string) {
    return this.svc.sendInvitation(id, req.user.id, invitationText);
  }

  // ─── Subscription Orders ────────────────────────────────────────

  @Get('payment-info')
  paymentInfo() {
    return this.svc.getSubscriptionPaymentInfo();
  }

  @Post('order')
  async createOrder(@Req() req: any, @Body('plan') plan: string) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.svc.createOrder(req.user.id, merchantId, plan);
  }

  @Post('order/:id/confirm-payment')
  async submitProof(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { payerName: string; payerPhone: string },
  ) {
    return this.svc.submitPaymentProof(id, req.user.id, body.payerName, body.payerPhone);
  }

  @Get('order/:id/status')
  async orderStatus(@Req() req: any, @Param('id') id: string) {
    return this.svc.getOrderStatus(id, req.user.id);
  }

  @Get('my-orders')
  async myOrders(@Req() req: any) {
    return this.svc.getMyOrders(req.user.id);
  }

  @Get('admin/orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async adminOrders(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.svc.getAllOrders(+page, +limit, status);
  }

  @Patch('admin/orders/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async adminConfirm(@Req() req: any, @Param('id') id: string, @Body('adminNote') adminNote?: string) {
    return this.svc.adminConfirmOrder(id, req.user.id, adminNote);
  }

  @Patch('admin/orders/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async adminReject(@Req() req: any, @Param('id') id: string, @Body('adminNote') adminNote: string) {
    return this.svc.adminRejectOrder(id, req.user.id, adminNote);
  }
}
