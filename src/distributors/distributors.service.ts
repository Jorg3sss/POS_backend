import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistributorsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.distributor.findMany({ include: { products: true } });
  }
}
