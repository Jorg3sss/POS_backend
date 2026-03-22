import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, nombre: true, correo: true, rol: true },
    });
  }

  async create(data: { nombre: string; correo: string; contra: string; rol: string }) {
    const exists = await this.prisma.user.findUnique({ where: { correo: data.correo } });
    if (exists) throw new ConflictException('El correo ya está registrado');

    const hashed = await bcrypt.hash(data.contra, 10);
    const user = await this.prisma.user.create({
      data: { ...data, contra: hashed },
    });
    const { contra, ...result } = user;
    return result;
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
