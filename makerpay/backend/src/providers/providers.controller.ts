import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { ConnectProviderDto } from './dto/connect-provider.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // ─── Provider Connections ─────────────────────────────────────────────

  @Post('connect')
  @ApiOperation({ summary: 'Connect a payment provider' })
  async connect(@Req() req: any, @Body() dto: ConnectProviderDto) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.connectProvider(merchantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List connected providers' })
  async list(@Req() req: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.getMerchantProviders(merchantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update provider connection' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<ConnectProviderDto>,
  ) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.updateProvider(merchantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect a provider' })
  async disconnect(@Req() req: any, @Param('id') id: string) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.disconnectProvider(merchantId, id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test provider connection' })
  async testConnection(@Req() req: any, @Param('id') id: string) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.testConnection(merchantId, id);
  }

  @Post('activate/:providerName')
  @ApiOperation({ summary: 'Activate a Makerpay partnership provider (mirpay, paynest)' })
  async activate(@Req() req: any, @Param('providerName') providerName: string) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.activateMakerpayProvider(merchantId, providerName);
  }

  // ─── API Keys ─────────────────────────────────────────────────────────

  @Post('api-keys')
  @ApiOperation({ summary: 'Create API key' })
  async createApiKey(@Req() req: any, @Body() dto: CreateApiKeyDto) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.createApiKey(merchantId, dto, req.user.id);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'List API keys' })
  async listApiKeys(@Req() req: any) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.getMerchantApiKeys(merchantId);
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Revoke API key' })
  async revokeApiKey(@Req() req: any, @Param('id') id: string) {
    const merchantId = req.user.merchantId || req.merchant?.id;
    return this.providersService.revokeApiKey(merchantId, id, req.user.id);
  }
}
