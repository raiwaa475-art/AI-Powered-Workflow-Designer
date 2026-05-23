import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/providerSession';

const PROVIDER_COOKIE = 'wfd_provider_cfg';

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(PROVIDER_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ configured: false, provider: null });
  }
  try {
    const decrypted = decrypt(raw);
    const { provider, apiKey } = JSON.parse(decrypted);
    // Return masked key — never expose the full key to the client
    const maskedKey = apiKey
      ? `${apiKey.substring(0, 4)}${'•'.repeat(Math.min(12, apiKey.length - 8))}${apiKey.slice(-4)}`
      : null;
    return NextResponse.json({ configured: true, provider, maskedKey });
  } catch {
    return NextResponse.json({ configured: false, provider: null });
  }
}
