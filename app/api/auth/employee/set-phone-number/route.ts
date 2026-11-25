import { NextResponse } from 'next/server';
import { proxyAuthRequest } from '@/lib/api';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { userId, phone_number } = body;

  if (!userId || !phone_number) {
    return NextResponse.json({ error: 'User ID and phone number are required', message: 'User ID and phone number are required' }, { status: 400 });
  }

  return proxyAuthRequest('/auth/set-phone-number', { userId, phone_number }, 'Phone number setup failed');
}
