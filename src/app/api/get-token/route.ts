import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identity = searchParams.get('identity');
  const room = searchParams.get('room');

  if (!identity || !room) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const at = new AccessToken(apiKey!, apiSecret!, {
    identity,
  });
  at.addGrant({ roomJoin: true, room });

  const token = await at.toJwt();
  return NextResponse.json({ token });
} 