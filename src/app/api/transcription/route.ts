import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';

const speechClient = new SpeechClient();

export async function GET(req: Request) {
  if (!req.headers.get('upgrade')?.includes('websocket')) {
    return new NextResponse('Expected WebSocket', { status: 400 });
  }

  const io = new Server({
    path: '/api/transcription',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    const recognizeStream = speechClient
      .streamingRecognize({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'es-ES',
          enableAutomaticPunctuation: true,
        },
        interimResults: true,
      })
      .on('data', (data) => {
        const transcription = data.results[0]?.alternatives[0]?.transcript;
        if (transcription) {
          socket.emit('transcription', {
            text: transcription,
            isFinal: data.results[0].isFinal,
            timestamp: Date.now(),
          });
        }
      })
      .on('error', (error) => {
        console.error('Error in transcription:', error);
        socket.emit('error', error.message);
      });

    socket.on('audio', (audioData: Buffer) => {
      recognizeStream.write(audioData);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      recognizeStream.destroy();
    });
  });

  return new NextResponse(null, {
    status: 101,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    },
  });
} 