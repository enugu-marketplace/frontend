import { NextResponse } from 'next/server';
import { proxyAuthRequest } from '@/lib/api';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required', message: 'User ID is required' }, { status: 400 });
  }

  return proxyAuthRequest('/auth/resend-otp', { userId }, 'Failed to resend OTP');
}
