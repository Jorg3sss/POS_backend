import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.expense.findMany({ orderBy: { fecha: 'desc' } });
  }

  create(data: { monto: number; descripcion: string }) {
    return this.prisma.expense.create({ data });
  }
}
