import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const COLLAB_SECRET = process.env.COLLAB_SECRET || 'dev-collab-secret-2025';

export async function GET(req: NextRequest) {
  try {
    const urlParams = new URL(req.url).searchParams;
    const roomId = urlParams.get('room');
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Generate secure HMAC-SHA256 matching collab-server.js's expectation
    const token = createHmac('sha256', COLLAB_SECRET)
      .update(`${roomId}:${COLLAB_SECRET}`)
      .digest('hex');

    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
