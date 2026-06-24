import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../prisma';

function signToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export const authService = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    gstin?: string;
    pan?: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered.', 409);

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        role: (data.role as 'ADMIN' | 'CA' | 'TAXPAYER') || 'TAXPAYER',
        gstin: data.gstin,
        pan: data.pan,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        gstin: true,
        pan: true,
        phone: true,
        createdAt: true,
      },
    });

    const token = signToken(user.id, user.email, user.role);
    return { user, token };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid email or password.', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid email or password.', 401);

    const token = signToken(user.id, user.email, user.role);
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        gstin: true,
        pan: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new AppError('User not found.', 404);
    return user;
  },

  async updateProfile(userId: string, data: { name?: string; phone?: string; gstin?: string; pan?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, name: true, role: true,
        gstin: true, pan: true, phone: true, updatedAt: true,
      },
    });
    return user;
  },

  refreshToken(userId: string, email: string, role: string) {
    return signToken(userId, email, role);
  },
};
