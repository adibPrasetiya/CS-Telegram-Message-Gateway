import jwt from 'jsonwebtoken';
import { UserPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as UserPayload;
};

export const getRefreshTokenExpiry = (): Date => {
  const expiresIn = JWT_REFRESH_EXPIRES_IN;
  const now = new Date();
  
  if (expiresIn.endsWith('d')) {
    const days = parseInt(expiresIn.slice(0, -1));
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  } else if (expiresIn.endsWith('h')) {
    const hours = parseInt(expiresIn.slice(0, -1));
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  } else if (expiresIn.endsWith('m')) {
    const minutes = parseInt(expiresIn.slice(0, -1));
    return new Date(now.getTime() + minutes * 60 * 1000);
  }
  
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
};