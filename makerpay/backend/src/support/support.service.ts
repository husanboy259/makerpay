import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketMessage } from './entities/support-ticket.entity';
import { CreateTicketDto, ReplyTicketDto } from './dto/create-ticket.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepo: Repository<TicketMessage>,
  ) {}

  async createTicket(merchantId: string, userId: string, dto: CreateTicketDto) {
    const count = await this.ticketRepo.count();
    const ticketNumber = `TKT-${String(count + 1).padStart(4, '0')}`;

    const ticket = this.ticketRepo.create({
      merchantId,
      createdBy: userId,
      ticketNumber,
      subject: dto.subject,
      description: dto.description,
      priority: dto.priority || 'medium',
      category: dto.category,
      paymentId: dto.paymentId,
      status: 'open',
    });

    const saved = await this.ticketRepo.save(ticket);

    const msg = this.messageRepo.create({
      ticketId: saved.id,
      userId,
      message: dto.description,
      isInternal: false,
    });
    await this.messageRepo.save(msg);

    return this.getTicketById(saved.id, UserRole.ADMIN);
  }

  async getMyTickets(merchantId: string, page = 1, limit = 20) {
    const [data, total] = await this.ticketRepo.findAndCount({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async getAllTickets(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await this.ticketRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  private isPrivilegedRole(role: string): boolean {
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT].includes(role as UserRole);
  }

  async getTicketById(id: string, callerRole: string, callerMerchantId?: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (!this.isPrivilegedRole(callerRole) && ticket.merchantId !== callerMerchantId) {
      throw new ForbiddenException('Access denied');
    }

    const messages = await this.messageRepo.find({
      where: { ticketId: id },
      order: { createdAt: 'ASC' },
    });

    return { ...ticket, messages };
  }

  async replyToTicket(ticketId: string, userId: string, callerRole: string, callerMerchantId: string | undefined, dto: ReplyTicketDto) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (!this.isPrivilegedRole(callerRole) && ticket.merchantId !== callerMerchantId) {
      throw new ForbiddenException('Access denied');
    }

    if (!ticket.firstResponseAt && dto.isInternal !== true) {
      await this.ticketRepo.update(ticketId, { firstResponseAt: new Date() });
    }

    const msg = this.messageRepo.create({
      ticketId,
      userId,
      message: dto.message,
      isInternal: dto.isInternal || false,
    });

    return this.messageRepo.save(msg);
  }

  async updateStatus(ticketId: string, status: string) {
    const update: any = { status };
    if (status === 'resolved') update.resolvedAt = new Date();
    if (status === 'closed') update.closedAt = new Date();
    await this.ticketRepo.update(ticketId, update);
    return this.getTicketById(ticketId, UserRole.ADMIN);
  }

  async assignTicket(ticketId: string, assignedTo: string) {
    await this.ticketRepo.update(ticketId, { assignedTo });
    return this.getTicketById(ticketId, UserRole.ADMIN);
  }
}
