import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar tablas (en orden de dependencias)
  try {
    await prisma.saleDetail.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.distributor.deleteMany();
  } catch (e) {
    console.log('ℹ️  Tablas vacías o no existentes, continuando...');
  }

  // 1. Distribuidores
  const distribuidores = await Promise.all([
    prisma.distributor.create({
      data: { nombre: 'Coca-Cola FEMSA', diaDeSurtir: 'Lunes', tel: '5551234567' },
    }),
    prisma.distributor.create({
      data: { nombre: 'Snacks del Norte', diaDeSurtir: 'Miércoles', tel: '5559876543' },
    }),
    prisma.distributor.create({
      data: { nombre: 'Bimbo Distribuciones', diaDeSurtir: 'Martes', tel: '5554567890' },
    }),
    prisma.distributor.create({
      data: { nombre: 'La Costeña S.A.', diaDeSurtir: 'Jueves', tel: '5557654321' },
    }),
  ]);
  console.log('✅ Distribuidores creados');

  // 2. Usuarios
  const adminPass = await bcrypt.hash('admin123', 10);
  const gerentePass = await bcrypt.hash('gerente123', 10);
  const vendedorPass = await bcrypt.hash('vendedor123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: { nombre: 'Admin Principal', correo: 'admin@pos.com', contra: adminPass, rol: 'ADMIN' },
    }),
    prisma.user.create({
      data: { nombre: 'María García', correo: 'gerente@pos.com', contra: gerentePass, rol: 'GERENTE' },
    }),
    prisma.user.create({
      data: { nombre: 'Carlos López', correo: 'vendedor@pos.com', contra: vendedorPass, rol: 'VENDEDOR' },
    }),
  ]);
  console.log('✅ Usuarios creados');

  // 3. Productos (los 4 específicos con imágenes)
  const productos = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'BEB-001',
        nombre: 'Coca-Cola 500ml',
        precio_venta: 18.0,
        precio_costo: 10.5,
        stock: 45,
        distribuidorId: distribuidores[0].id,
        imagenUrl: 'coca-cola-500ml',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'SNA-001',
        nombre: 'Ruffles Original',
        precio_venta: 15.0,
        precio_costo: 8.0,
        stock: 8,
        distribuidorId: distribuidores[1].id,
        imagenUrl: 'ruffles',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PAN-001',
        nombre: 'Pan Bimbo 620gr',
        precio_venta: 45.0,
        precio_costo: 30.0,
        stock: 20,
        distribuidorId: distribuidores[2].id,
        imagenUrl: 'pan-bimbo-620gr',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ENL-001',
        nombre: 'Chiles Enteros Costeña',
        precio_venta: 25.0,
        precio_costo: 14.0,
        stock: 0,
        distribuidorId: distribuidores[3].id,
        imagenUrl: 'chiles-enteros-costena',
      },
    }),
  ]);
  console.log('✅ Productos creados');

  // 4. Ventas aleatorias (últimos 3 meses)
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);

  const tiposPago = ['EFECTIVO', 'TARJETA'];
  const productosActivos = productos.filter((p) => p.stock > 0);

  const stockDisponible: Record<number, number> = {};
  for (const p of productos) {
    stockDisponible[p.id] = p.stock;
  }

  for (let i = 0; i < 40; i++) {
    const fecha = randomDate(threeMonthsAgo, now);
    const tipoPago = tiposPago[randomBetween(0, 1)];
    const userId = users[randomBetween(0, 2)].id;
    const numItems = randomBetween(1, 3);

    const items: { productId: number; cantidad: number; precio_unitario: number }[] = [];
    const usados = new Set<number>();

    for (let j = 0; j < numItems; j++) {
      const prod = productosActivos[randomBetween(0, productosActivos.length - 1)];
      if (usados.has(prod.id)) continue;
      const disponible = stockDisponible[prod.id] ?? 0;
      if (disponible <= 0) continue;
      const cantidad = randomBetween(1, Math.min(3, disponible));
      items.push({ productId: prod.id, cantidad, precio_unitario: Number(prod.precio_venta) });
      stockDisponible[prod.id] = disponible - cantidad;
      usados.add(prod.id);
    }

    if (items.length === 0) continue;

    const total = items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);
    const pagoCon = tipoPago === 'EFECTIVO' ? total + randomBetween(0, 50) : null;
    const cambio = pagoCon !== null ? pagoCon - total : null;

    await prisma.sale.create({
      data: {
        total,
        tipo_pago: tipoPago,
        pago_con: pagoCon,
        cambio,
        estado: 'COMPLETADA',
        createdAt: fecha,
        userId,
        details: {
          create: items,
        },
      },
    });
  }
  console.log('✅ Ventas aleatorias creadas');

  // 5. Egresos aleatorios (últimos 3 meses)
  const descripcionesEgresos = [
    'Pago proveedor Coca-Cola FEMSA',
    'Pago proveedor Bimbo',
    'Pago proveedor Snacks del Norte',
    'Pago proveedor La Costeña',
    'Recibo de Luz (CFE)',
    'Renta del local',
    'Servicio de internet',
    'Limpieza y mantenimiento',
    'Compra de bolsas y empaques',
    'Pago de nómina semanal',
  ];

  for (let i = 0; i < 20; i++) {
    const fecha = randomDate(threeMonthsAgo, now);
    const descripcion = descripcionesEgresos[randomBetween(0, descripcionesEgresos.length - 1)];
    const monto = randomBetween(200, 5000);

    await prisma.expense.create({
      data: { monto, descripcion, fecha },
    });
  }
  console.log('✅ Egresos aleatorios creados');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('👤 Credenciales de acceso:');
  console.log('   Admin:   admin@pos.com    / admin123');
  console.log('   Gerente: gerente@pos.com  / gerente123');
  console.log('   Vendedor:vendedor@pos.com / vendedor123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
