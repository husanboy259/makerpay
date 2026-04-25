import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('markets')
@UseGuards(JwtAuthGuard)
export class MarketsController {
  constructor(private service: MarketsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.service.create(req.user.id, {
      name:        body.name,
      url:         body.url,
      webhookUrl:  body.webhookUrl,
      description: body.description,
    });
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(req.user.id, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
