import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/providerSession';

const PROVIDER_COOKIE = 'wfd_provider_cfg';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !['openai', 'anthropic', 'deepseek'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
      return NextResponse.json({ error: 'API key is too short or missing' }, { status: 400 });
    }

    const payload = JSON.stringify({ provider, apiKey: apiKey.trim() });
    const encryptedPayload = encrypt(payload);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(PROVIDER_COOKIE, encryptedPayload, {
      httpOnly: true,      // Not accessible from JS — prevents XSS key theft
      sameSite: 'strict',  // CSRF protection
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PROVIDER_COOKIE);
  return res;
}
