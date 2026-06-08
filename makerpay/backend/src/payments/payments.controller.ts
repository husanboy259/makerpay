import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentPublicDto } from './dto/create-payment-public.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

// ─── Public endpoints (no auth) ──────────────────────────────────────────────
@ApiTags('payments-public')
@Controller('payments/public')
export class PaymentsPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get payment info publicly' })
  getPublic(@Param('id') id: string) {
    return this.paymentsService.getPaymentPublic(id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manual payment confirmation by customer' })
  manualConfirm(
    @Param('id') id: string,
    @Body() body: { customerName?: string; customerPhone?: string },
  ) {
    return this.paymentsService.manualConfirm(id, body.customerName, body.customerPhone);
  }
}

// ─── API-key protected endpoint (for embeddable checkout / SDK) ─────────────
@ApiTags('payments-api')
@ApiSecurity('x-api-key')
@Controller('payments/api')
export class PaymentsApiController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Create a payment using a merchant API key' })
  async createViaApiKey(@Req() req: any, @Body() dto: CreatePaymentPublicDto) {
    const createDto: CreatePaymentDto = {
      amount: dto.amount,
      currency: dto.currency,
      externalOrderId: dto.orderId,
      providerName: dto.providerName,
      description: dto.description,
      returnUrl: dto.successUrl,
      callbackUrl: dto.callbackUrl,
      customerPhone: dto.customerPhone,
    };
    return this.paymentsService.createPayment(req.merchant.id, createDto, req.apiKey.id);
  }
}

// ─── Protected endpoints ──────────────────────────────────────────────────────
@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new payment' })
  async createPayment(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.paymentsService.createPayment(merchantId, dto, req.apiKeyId);
  }

  @Get()
  @ApiOperation({ summary: 'List payments with filters' })
  async getPayments(@Req() req: any, @Query() query: QueryPaymentsDto) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.paymentsService.getPayments(merchantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getStats(@Req() req: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.paymentsService.getMerchantStats(merchantId);
  }

  @Get('chart')
  @ApiOperation({ summary: 'Get daily revenue chart data' })
  async getChart(@Req() req: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.paymentsService.getDailyChart(merchantId, 7);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment status' })
  async getPaymentStatus(@Req() req: any, @Param('id') id: string) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.paymentsService.getPaymentStatus(merchantId, id);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment' })
  async refundPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.paymentsService.refundPayment(merchantId, id, dto, req.user.id);
  }
}
