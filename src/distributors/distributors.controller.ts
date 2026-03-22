import { Controller, Get, UseGuards } from '@nestjs/common';
import { DistributorsService } from './distributors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('distributors')
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Get()
  findAll() {
    return this.distributorsService.findAll();
  }
}
