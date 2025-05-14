import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Track } from 'livekit-client';

interface TranscriptionHandlerProps {
    track: Track;
    userId: string;
    onTranscription: (text: string, isFinal: boolean, timestamp: number) => void;
}

export const TranscriptionHandler = ({ track, userId, onTranscription }: TranscriptionHandlerProps) => {
    const socketRef = useRef<Socket | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const initializeAudio = () => {
        if (!isInitialized && track.mediaStream) {
            try {
                audioContextRef.current = new AudioContext();
                const source = audioContextRef.current.createMediaStreamSource(track.mediaStream);
                processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                processorRef.current.onaudioprocess = (e) => {
                    const audioData = e.inputBuffer.getChannelData(0);
                    if (socketRef.current?.connected) {
                        socketRef.current.emit('audio', audioData);
                    }
                };

                source.connect(processorRef.current);
                processorRef.current.connect(audioContextRef.current.destination);
                setIsInitialized(true);
            } catch (error) {
                console.error('Error initializing audio:', error);
            }
        }
    };

    useEffect(() => {
        socketRef.current = io('/api/transcription');

        socketRef.current.on('transcription', (data) => {
            onTranscription(data.text, data.isFinal, data.timestamp);
        });

        socketRef.current.on('error', (error) => {
            console.error('Transcription error:', error);
        });

        return () => {
            if (processorRef.current) {
                processorRef.current.disconnect();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            socketRef.current?.disconnect();
        };
    }, [track, userId, onTranscription]);

    return (
        <button
            onClick={initializeAudio}
            className="fixed bottom-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
            disabled={isInitialized}
        >
            {isInitialized ? 'Transcription Active' : 'Start Transcription'}
        </button>
    );
}; 