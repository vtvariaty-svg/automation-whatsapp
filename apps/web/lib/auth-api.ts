import jwt from 'jsonwebtoken';
import { isRevoked } from '@/lib/tokenBlacklist';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthUser {
  userId: string;
  tenantId: string;
}

export const getAuthUser = async (req: Request): Promise<AuthUser | null> => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    if (await isRevoked(token)) return null;
    return decoded;
  } catch {
    return null;
  }
};
