import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(correo: string, contra: string) {
    const user = await this.prisma.user.findUnique({ where: { correo } });
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const valid = await bcrypt.compare(contra, user.contra);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { sub: user.id, correo: user.correo, rol: user.rol, nombre: user.nombre };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol },
    };
  }
}
