import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('merchants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create merchant profile' })
  async create(@Req() req: any, @Body() dto: CreateMerchantDto) {
    return this.merchantsService.create(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my merchant profile' })
  async getMyMerchant(@Req() req: any) {
    return this.merchantsService.getMyMerchant(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update my merchant profile' })
  async update(@Req() req: any, @Body() dto: UpdateMerchantDto) {
    return this.merchantsService.update(req.user.id, dto);
  }

  // Admin/Manager only
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT)
  @ApiOperation({ summary: 'List all merchants (admin)' })
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.merchantsService.getAll(+page, +limit, search, status);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get merchant by ID (admin)' })
  async getById(@Param('id') id: string) {
    return this.merchantsService.getById(id);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve merchant (admin)' })
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.merchantsService.approve(id, req.user.id);
  }

  @Post(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Suspend merchant (admin)' })
  async suspend(
    @Param('id') id: string,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    return this.merchantsService.suspend(id, req.user.id, reason);
  }
}
