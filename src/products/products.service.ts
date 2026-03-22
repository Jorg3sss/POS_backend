import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.product.findMany({
      where: search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { distribuidor: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id }, include: { distribuidor: true } });
  }

  create(data: {
    sku: string;
    nombre: string;
    precio_venta: number;
    precio_costo: number;
    stock: number;
    distribuidorId: number;
    imagenUrl?: string;
  }) {
    return this.prisma.product.create({ data });
  }

  update(id: number, data: Partial<{
    nombre: string;
    precio_venta: number;
    precio_costo: number;
    stock: number;
    imagenUrl: string;
  }>) {
    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
