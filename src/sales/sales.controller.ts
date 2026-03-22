import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.salesService.create({ ...body, userId: req.user.id });
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  cancel(@Param('id') id: string) {
    return this.salesService.cancel(+id);
  }
}
