import {
  Controller, Get, Post, Patch, Body, Param,
  Req, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto, ReplyTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  async getOne(@Param('id') id: string) {
    return this.supportService.getTicketById(id);
  }

  @Post('tickets/:id/reply')
  @ApiOperation({ summary: 'Reply to a ticket' })
  async reply(@Req() req: any, @Param('id') id: string, @Body() dto: ReplyTicketDto) {
    return this.supportService.replyToTicket(id, req.user.id, dto);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateStatus(id, status);
  }

  @Patch('tickets/:id/assign')
  @ApiOperation({ summary: 'Assign ticket to support agent' })
  async assign(@Param('id') id: string, @Body('userId') userId: string) {
    return this.supportService.assignTicket(id, userId);
  }
}
