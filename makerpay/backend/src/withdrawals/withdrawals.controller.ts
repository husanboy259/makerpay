import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly svc: WithdrawalsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request withdrawal (min 15,000 UZS)' })
  async request(@Req() req: any, @Body() body: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.svc.request(merchantId, body);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my withdrawals' })
  async getMy(@Req() req: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.svc.getMyWithdrawals(merchantId);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'All withdrawals (admin)' })
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.svc.getAll(+page, +limit, status);
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Withdrawal stats (admin)' })
  async getStats() {
    return this.svc.getStats();
  }

  @Patch('admin/:id/approve')
  @ApiOperation({ summary: 'Approve withdrawal (admin)' })
  async approve(@Req() req: any, @Param('id') id: string, @Body('adminNote') note?: string) {
    return this.svc.approve(id, req.user.id, note);
  }

  @Patch('admin/:id/reject')
  @ApiOperation({ summary: 'Reject withdrawal (admin)' })
  async reject(@Req() req: any, @Param('id') id: string, @Body('adminNote') note: string) {
    return this.svc.reject(id, req.user.id, note);
  }
}
