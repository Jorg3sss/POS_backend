import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SaleItem {
  productId: number;
  cantidad: number;
  precio_unitario: number;
}

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId: number;
    tipo_pago: string;
    pago_con?: number;
    cambio?: number;
    items: SaleItem[];
  }) {
    // Validate stock
    for (const item of data.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new BadRequestException(`Producto ${item.productId} no encontrado`);
      if (product.stock < item.cantidad)
        throw new BadRequestException(`Stock insuficiente para ${product.nombre}`);
    }

    const total = data.items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          total,
          tipo_pago: data.tipo_pago,
          pago_con: data.pago_con,
          cambio: data.cambio,
          userId: data.userId,
          details: {
            create: data.items.map((i) => ({
              productId: i.productId,
              cantidad: i.cantidad,
              precio_unitario: i.precio_unitario,
            })),
          },
        },
        include: { details: true },
      });

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.cantidad } },
        });
      }

      return sale;
    });
  }

  findAll() {
    return this.prisma.sale.findMany({
      include: { details: { include: { product: true } }, user: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(id: number) {
    return this.prisma.sale.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    });
  }
}
