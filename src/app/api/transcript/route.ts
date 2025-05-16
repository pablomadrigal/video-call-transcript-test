import { NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    // Get room ID from URL
    const url = new URL(request.url);
    const roomId = url.searchParams.get('room');

    if (!roomId) {
      return NextResponse.json(
        { success: false, message: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Use environment variable or fallback to a secure default
    const transcriptsDir = process.env.TRANSCRIPTS_DIR || path.join(process.cwd(), '..', 'transcripts');
    const filePath = path.join(transcriptsDir, `${roomId}.json`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Read and parse the transcript file
    const transcriptData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return NextResponse.json({
      transcripts: transcriptData.transcripts
    });
  } catch (error) {
    console.error('Error reading transcript:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to read transcript' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("data", data);
    if (!data.room) {
      return NextResponse.json(
        { success: false, message: 'Room name is required' },
        { status: 400 }
      );
    }

    // Use environment variable or fallback to a secure default
    const transcriptsDir = process.env.TRANSCRIPTS_DIR || path.join(process.cwd(), '..', 'transcripts');
    console.log("transcriptsDir", transcriptsDir);

    // Create transcripts directory if it doesn't exist
    if (!fs.existsSync(transcriptsDir)) {
      fs.mkdirSync(transcriptsDir, { recursive: true });
    }

    // Use room name as filename
    const filename = `${data.room}.json`;
    const filePath = path.join(transcriptsDir, filename);
    console.log("filePath", filePath);
    // Save transcript to file (will overwrite if exists)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'Transcript saved successfully',
      filename 
    });
  } catch (error) {
    console.error('Error saving transcript:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save transcript' },
      { status: 500 }
    );
  }
}
