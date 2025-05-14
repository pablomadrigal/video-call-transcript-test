import { NextResponse } from 'next/server';
import { EgressClient, RoomServiceClient } from 'livekit-server-sdk';

const apiKey = process.env.LK_API_KEY;
const apiSecret = process.env.LK_API_SECRET;
const livekitUrl = process.env.LK_HOST;

export async function POST(request: Request) {
  try {
    const { roomName, trackId, identity } = await request.json();
    if (!roomName || !trackId || !identity) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    const svc = new EgressClient(livekitUrl!, apiKey!, apiSecret!);
    const result = await svc.startTrackEgress(
      roomName,
      trackId,
      file: {
        filepath: `recordings/${roomName}_${identity}_${trackId}_${Date.now()}.wav`,
        file_type: 'wav',
      },
    );
    return NextResponse.json({ status: 'Recording started', egressInfo: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 });
  }
} 