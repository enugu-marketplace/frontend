import { NextResponse } from 'next/server';
import { proxyAuthRequest } from '@/lib/api';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { userId, password, password_confirmation } = body;

  if (!userId || !password || !password_confirmation) {
    return NextResponse.json({ error: 'All fields are required', message: 'All fields are required' }, { status: 400 });
  }

  return proxyAuthRequest('/auth/set-password', { userId, password, password_confirmation }, 'Password setup failed');
}
