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
          sampleRateHertz: 48000,
          languageCode: 'es-ES',
          enableAutomaticPunctuation: true,
          model: 'default',
          useEnhanced: true,
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
      })
      .on('end', () => {
        console.log('Transcription stream ended');
      });

    socket.on('audio', (audioData: Float32Array) => {
      try {
        // Convert Float32Array to Int16Array for Google Speech API
        const int16Data = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          int16Data[i] = Math.max(-32768, Math.min(32767, Math.round(audioData[i] * 32767)));
        }
        recognizeStream.write(int16Data.buffer);
      } catch (error) {
        console.error('Error processing audio data:', error);
      }
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