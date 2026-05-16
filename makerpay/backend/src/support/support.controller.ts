import {
  Controller, Get, Post, Patch, Body, Param,
  Req, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto, ReplyTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  async create(@Req() req: any, @Body() dto: CreateTicketDto) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.supportService.createTicket(merchantId, req.user.id, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get my tickets (merchant) or all tickets (admin/support)' })
  async list(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const role = req.user.role;
    if (role === 'admin' || role === 'support' || role === 'manager') {
      return this.supportService.getAllTickets(+page, +limit, status);
    }
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.supportService.getMyTickets(merchantId, +page, +limit);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async getOne(@Req() req: any, @Param('id') id: string) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.supportService.getTicketById(id, req.user.role, merchantId);
  }

  @Post('tickets/:id/reply')
  @ApiOperation({ summary: 'Reply to a ticket' })
  async reply(@Req() req: any, @Param('id') id: string, @Body() dto: ReplyTicketDto) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.supportService.replyToTicket(id, req.user.id, req.user.role, merchantId, dto);
  }

  @Patch('tickets/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Update ticket status (admin/support only)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateStatus(id, status);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign ticket to support agent (admin only)' })
  async assign(@Param('id') id: string, @Body('userId') userId: string) {
    return this.supportService.assignTicket(id, userId);
  }
}
