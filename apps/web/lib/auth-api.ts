import jwt from 'jsonwebtoken';
import { isRevoked } from '@/lib/tokenBlacklist';
import { prisma } from '@/lib/prisma';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: string;
}

export const getAuthUser = async (req: Request): Promise<AuthUser | null> => {
  const authHeader = req.headers.get('authorization');
  
  // Extract token from Authorization header or from auth_token cookie
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Fall back to cookie (used by browser-based navigation)
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (cookieMatch) token = decodeURIComponent(cookieMatch[1]);
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & { sessionVersion?: number };
    if (await isRevoked(token)) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { sessionVersion: true }
    });
    
    if (!dbUser || dbUser.sessionVersion !== decoded.sessionVersion) return null;

    return { userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role || 'user' };
  } catch {
    return null;
  }
};
