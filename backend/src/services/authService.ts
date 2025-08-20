import bcrypt from 'bcryptjs';
import prisma from '../utils/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt';
import { AuthTokens, CreateUserRequest, LoginRequest, UserPayload } from '../types';

export class AuthService {
  async register(userData: CreateUserRequest): Promise<AuthTokens> {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role || 'CS'
      }
    });

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry()
      }
    });

    return { accessToken, refreshToken };
  }

  async login(loginData: LoginRequest): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email: loginData.email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { statusOnline: true }
    });

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id }
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry()
      }
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const decoded = verifyRefreshToken(token);
      
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      const payload: UserPayload = {
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role
      };

      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: newRefreshToken,
          expiresAt: getRefreshTokenExpiry()
        }
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await Promise.all([
      prisma.refreshToken.deleteMany({
        where: { userId }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { statusOnline: false }
      })
    ]);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        statusOnline: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}