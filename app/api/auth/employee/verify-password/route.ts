import { NextResponse } from 'next/server';
import { proxyAuthRequest } from '@/lib/api';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { userId, password } = body;

  if (!userId || !password) {
    return NextResponse.json({ error: 'User ID and password are required', message: 'User ID and password are required' }, { status: 400 });
  }

  return proxyAuthRequest('/auth/verify-password', { userId, password }, 'Password verification failed');
}
