import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    rid: string;
    role: string;
    email: string;
  };
}

export async function authenticateToken(request: NextRequest): Promise<NextResponse | { uid: string; rid: string; role: string; email: string }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return NextResponse.json(
      { error: 'Access token required' },
      { status: 401 }
    );
  }

  try {
    const user = verifyToken(token);
    return user;
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

export function requireRole(allowedRoles: string[]) {
  return (user: { uid: string; rid?: string; role: string; email: string }, response: NextResponse) => {
    // Normalize role: RESTAURANT from normal login = manager from employee login
    let userRole = user.role.toLowerCase();
    if (userRole === 'restaurant') {
      userRole = 'manager';
    }

    const allowed = allowedRoles.map(r => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return null; // Continue with the request
  };
}