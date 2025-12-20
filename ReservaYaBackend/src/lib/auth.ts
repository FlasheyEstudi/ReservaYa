import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Employee, Restaurant } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Application cannot start without a secure secret.');
}

export interface JWTPayload {
  uid: string;
  rid: string;
  oid?: string; // organizationId for multi-branch support
  role: string;
  email: string;
}

export const hashPin = async (pin: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(pin, saltRounds);
};

export const verifyPin = async (pin: string, hashedPin: string): Promise<boolean> => {
  return bcrypt.compare(pin, hashedPin);
};

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateBusinessCode = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${random}`;
};