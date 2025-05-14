import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;
const livekitUrl = process.env.LK_HOST;

// In a real system, you should track egress IDs per participant/session
// For demo, expects egressId in the request

export async function POST(request: Request) {
  try {
    const { egressId } = await request.json();
    if (!egressId) {
      return NextResponse.json({ error: 'Missing egressId' }, { status: 400 });
    }
    const svc = new RoomServiceClient(livekitUrl!, apiKey!, apiSecret!);
    
    await svc.stopEgress(egressId);
    return NextResponse.json({ status: 'Recording stopped' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to stop recording' }, { status: 500 });
  }
} 