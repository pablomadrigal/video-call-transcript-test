"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GridLayout, ParticipantTile, RoomAudioRenderer, useRoomContext, useTracks, ControlBar, PreJoin } from '@livekit/components-react';
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
    const router = useRouter();

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

    useEffect(() => {
        const handleDisconnected = () => {
            router.push('/meeting');
        };
        room.on(RoomEvent.Disconnected, handleDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [room, router]);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-blue-200">
            <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-4 p-4">
                <div className="w-full rounded-2xl shadow-lg bg-white/80 backdrop-blur-md p-2 flex flex-col items-center">
                    <GridLayout
                        tracks={tracks}
                    >
                        <ParticipantTile />
                    </GridLayout>
                    <ControlBar />
                    <div className="w-full flex justify-center mt-2">
                        <RoomAudioRenderer />
                        <AudioTranscriptionHandler />
                    </div>
                </div>
            </div>
            {/* Transcription floating box */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-xl bg-white/90 p-4 rounded-xl shadow-2xl border border-blue-100 backdrop-blur-md z-50 overflow-y-auto max-h-48 animate-fade-in">
                <h3 className="text-blue-700 font-semibold mb-2">Live Transcription</h3>
                {transcriptions.length === 0 ? (
                    <div className="text-gray-400 italic text-center">No transcription yet...</div>
                ) : (
                    transcriptions.slice(-8).map((t, i) => (
                        <div key={i} className={`mb-1 ${t.isFinal ? 'font-normal' : 'font-light italic'}`}>
                            <span className="text-gray-500 text-xs">
                                {new Date(t.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="font-bold ml-2 text-blue-700">{t.userId}:</span>
                            <span className="ml-2">{t.text}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function RoomPage() {
    const params = useParams();
    const roomName = params?.roomName as string;
    const [token, setToken] = useState<string | null>(null);
    const [enterRoom, setEnterRoom] = useState<boolean>(false);
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
                // Enable audio and video tracks
                await room.localParticipant.enableCameraAndMicrophone();
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
        <div>
            {enterRoom ? (
                <RoomContext.Provider value={room}>
                    <RoomContent />
                </RoomContext.Provider>
            ) : (
                <PreJoin onSubmit={() => setEnterRoom(true)} />
            )}
        </div>
    );
} 