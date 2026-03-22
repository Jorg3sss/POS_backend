import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getIngresos(filtro: string = 'semana', startDate?: string, endDate?: string) {
    const { start, end } = this.resolveDates(filtro, startDate, endDate);

    const sales = await this.prisma.sale.findMany({
      where: { estado: 'COMPLETADA', createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
    });

    const { labels, chartData } = this.buildChartData(sales, filtro, start, end, 'total', 'createdAt');
    const tabla = sales.map((s) => ({
      id: String(s.id),
      fecha: s.createdAt.toLocaleDateString('es-MX'),
      monto: Number(s.total),
    }));
    const totalPeriodo = sales.reduce((sum, s) => sum + Number(s.total), 0);

    return { chartLabels: labels, chartData, tabla, totalPeriodo, hasData: sales.length > 0 };
  }

  async getEgresos(filtro: string = 'semana', startDate?: string, endDate?: string) {
    const { start, end } = this.resolveDates(filtro, startDate, endDate);

    const expenses = await this.prisma.expense.findMany({
      where: { fecha: { gte: start, lte: end } },
      orderBy: { fecha: 'asc' },
    });

    const { labels, chartData } = this.buildChartData(expenses, filtro, start, end, 'monto', 'fecha');
    const tabla = expenses.map((e) => ({
      id: String(e.id),
      descripcion: e.descripcion,
      fecha: e.fecha.toLocaleDateString('es-MX'),
      monto: Number(e.monto),
    }));
    const totalPeriodo = expenses.reduce((sum, e) => sum + Number(e.monto), 0);

    return { chartLabels: labels, chartData, tabla, totalPeriodo, hasData: expenses.length > 0 };
  }

  private resolveDates(filtro: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
    if (startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }
    const now = new Date();
    switch (filtro) {
      case 'dia': {
        const s = new Date(now); s.setHours(0, 0, 0, 0);
        const e = new Date(now); e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
      case 'semana': {
        const s = new Date(now); s.setDate(now.getDate() - 6); s.setHours(0, 0, 0, 0);
        const e = new Date(now); e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
      case 'mes': {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: s, end: e };
      }
      case 'anio': {
        const s = new Date(now.getFullYear(), 0, 1);
        const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start: s, end: e };
      }
      default: {
        const s = new Date(now); s.setDate(now.getDate() - 6); s.setHours(0, 0, 0, 0);
        return { start: s, end: new Date(now) };
      }
    }
  }

  private buildChartData(
    records: any[], filtro: string, start: Date, end: Date, field: string, dateField: string,
  ): { labels: string[]; chartData: number[] } {
    const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    let labels: string[] = [];
    let buckets: number[] = [];

    if (filtro === 'dia') {
      labels = ['00h','04h','08h','12h','16h','20h'];
      buckets = new Array(6).fill(0);
      for (const r of records) {
        const h = new Date(r[dateField]).getHours();
        const idx = Math.min(Math.floor(h / 4), 5);
        buckets[idx] += Number(r[field]);
      }
    } else if (filtro === 'semana') {
      const days: Date[] = [];
      const cur = new Date(start);
      while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
      labels = days.map((d) => `${DIAS[d.getDay()]} ${d.getDate()}`);
      buckets = new Array(days.length).fill(0);
      for (const r of records) {
        const rd = new Date(r[dateField]);
        const idx = days.findIndex((d) => d.toDateString() === rd.toDateString());
        if (idx >= 0) buckets[idx] += Number(r[field]);
      }
    } else if (filtro === 'mes') {
      labels = ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5'];
      buckets = new Array(5).fill(0);
      for (const r of records) {
        const day = new Date(r[dateField]).getDate();
        const idx = Math.min(Math.floor((day - 1) / 7), 4);
        buckets[idx] += Number(r[field]);
      }
    } else if (filtro === 'anio') {
      labels = MESES;
      buckets = new Array(12).fill(0);
      for (const r of records) {
        const idx = new Date(r[dateField]).getMonth();
        buckets[idx] += Number(r[field]);
      }
    }

    // Ensure no zeros cause issues with chart
    const chartData = buckets.map((v) => Math.round(v * 100) / 100);
    return { labels, chartData };
  }
}
