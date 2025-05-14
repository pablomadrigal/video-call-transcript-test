"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GridLayout, ParticipantTile, RoomAudioRenderer, useRoomContext, useTracks, ControlBar } from '@livekit/components-react';
import { RoomEvent, LocalTrackPublication, Track, Room } from 'livekit-client';
import { TranscriptionHandler } from '@/components/TranscriptionHandler';
import { RoomContext } from '@livekit/components-react';

interface Transcription {
    text: string;
    isFinal: boolean;
    timestamp: number;
    userId: string;
}

function RoomContent() {
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const room = useRoomContext();
    const [identity, setIdentity] = useState<string>('');

    useEffect(() => {
        const randomIdentity = `user-${Math.random().toString(36).substring(2, 8)}`;
        setIdentity(randomIdentity);
    }, []);

    const handleTranscription = (text: string, isFinal: boolean, timestamp: number) => {
        setTranscriptions(prev => [...prev, { text, isFinal, timestamp, userId: identity }]);
    };

    function AudioTranscriptionHandler() {
        const [localAudioTrack, setLocalAudioTrack] = useState<Track | null>(null);

        useEffect(() => {
            const handleTrackPublished = (pub: LocalTrackPublication) => {
                if (pub.kind === 'audio' && pub.track) {
                    setLocalAudioTrack(pub.track);
                }
            };

            const handleTrackUnpublished = () => {
                setLocalAudioTrack(null);
            };

            room.on(RoomEvent.LocalTrackPublished, handleTrackPublished);
            room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);

            return () => {
                room.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
                room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
            };
        }, [room]);

        if (!localAudioTrack) return null;

        return (
            <TranscriptionHandler
                track={localAudioTrack}
                userId={identity}
                onTranscription={handleTranscription}
            />
        );
    }

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    return (
        <>
            <div data-lk-theme="default" style={{ height: '100dvh' }}>
                <GridLayout tracks={tracks} style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}>
                    <ParticipantTile />
                </GridLayout>
                <RoomAudioRenderer />
                <ControlBar />
                <AudioTranscriptionHandler />
            </div>
            <div className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {transcriptions.map((t, i) => (
                    <div key={i} className={`mb-2 ${t.isFinal ? 'font-normal' : 'font-light italic'}`}>
                        <span className="text-gray-500 text-sm">
                            {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="font-bold ml-2">{t.userId}:</span>
                        <span className="ml-2">{t.text}</span>
                    </div>
                ))}
            </div>
        </>
    );
}

export default function RoomPage() {
    const params = useParams();
    const roomName = params?.roomName as string;
    const [token, setToken] = useState<string | null>(null);
    const [room] = useState(() => new Room({
        adaptiveStream: true,
        dynacast: true,
    }));

    useEffect(() => {
        if (!roomName) return;
        fetch(`/api/get-token?identity=user-${Math.random().toString(36).substring(2, 8)}&room=${roomName}`)
            .then(res => res.json())
            .then(async data => {
                setToken(data.token);
                await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);
            });

        return () => {
            room.disconnect();
        };
    }, [roomName, room]);

    if (!roomName) {
        return <div className="flex items-center justify-center h-screen">Room not found.</div>;
    }

    if (!token) {
        return <div className="flex items-center justify-center h-screen">Connecting to room...</div>;
    }

    return (
        <div className="h-screen w-screen bg-gray-50">
            <RoomContext.Provider value={room}>
                <RoomContent />
            </RoomContext.Provider>
        </div>
    );
} 