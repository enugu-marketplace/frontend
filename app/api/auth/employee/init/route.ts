import { NextResponse } from 'next/server';
import { proxyAuthRequest } from '@/lib/api';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { identifier } = body;

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier is required', message: 'Identifier is required' }, { status: 400 });
  }

  return proxyAuthRequest('/auth/initiate-login', { identifier }, 'Could not start sign in');
}
