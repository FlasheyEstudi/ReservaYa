import jwt from 'jsonwebtoken';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 10) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set or is too short');
  }
  return secret;
}

export function verifyToken(token: string) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as any;
}

// Additional Auth Helpers
import bcrypt from 'bcrypt';

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function comparePin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function generateToken(payload: object, expiresIn: string | number = '24h'): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function generateBusinessCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${random}`;
}

export const hashPassword = hashPin;
export const comparePassword = comparePin;
export const verifyPin = comparePin;