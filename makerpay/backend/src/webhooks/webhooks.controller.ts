import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  // Public endpoints — payment providers call these
  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook from payment provider' })
  async receiveWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-signature') signature: string,
    @Headers('x-tspay-signature') tsPaySig: string,
    @Headers('x-paynest-signature') paynestSig: string,
  ) {
    const sig = signature || tsPaySig || paynestSig;
    await this.webhooksService.handleInboundWebhook(provider, payload, sig);
    return { received: true };
  }

  // Protected — merchant views their logs
  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get webhook logs' })
  async getWebhookLogs(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.webhooksService.getMerchantWebhookLogs(merchantId, +page, +limit);
  }
}
