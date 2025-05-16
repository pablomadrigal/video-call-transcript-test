"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRoomContext, useTracks, ControlBar, PreJoin, ParticipantName, formatChatMessageLinks, VideoConference } from '@livekit/components-react';
import { RoomEvent, Track, Room, isLocalTrack } from 'livekit-client';
import { RoomContext } from '@livekit/components-react';

function RoomContent({ disconnect }: { disconnect: () => any }) {
    const room = useRoomContext();
    const [identity, setIdentity] = useState<string>('');

    useEffect(() => {
        const randomIdentity = `user-${Math.random().toString(36).substring(2, 8)}`;
        setIdentity(randomIdentity);
    }, []);

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    useEffect(() => {
        const handleDisconnected = () => {
            disconnect();
        };
        room.on(RoomEvent.Disconnected, handleDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [room]);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-blue-200">
            <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-4 p-4">
                <VideoConference
                    chatMessageFormatter={formatChatMessageLinks}
                />
            </div>
        </div>
    );
}

function RoomWrapper({ roomName, room, displayName, disconnect }: { roomName: string, room: Room, displayName?: string, disconnect: () => any }) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        if (!roomName) return;
        fetch(`/api/get-token?identity=${displayName ?? 'user-' + Math.random().toString(36).substring(2, 8)}&room=${roomName}`)
            .then(res => res.json())
            .then(async data => {
                setToken(data.token);
                try {
                    await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);
                    // Enable camera and microphone with error handling
                    await room.localParticipant.enableCameraAndMicrophone();
                    console.log('Camera and microphone enabled');
                } catch (error) {
                    console.error('Error connecting to room:', error);
                }
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
        <RoomContext.Provider value={room}>
            <RoomContent disconnect={disconnect} />
        </RoomContext.Provider>
    );
}

export default function RoomPage() {
    const params = useParams();
    const roomName = params?.roomName as string;
    const [enterRoom, setEnterRoom] = useState<boolean>(false);
    const [room] = useState(() => new Room({
        adaptiveStream: true,
        dynacast: true,
    }));

    return (
        <div>
            {enterRoom ? (
                <RoomWrapper roomName={roomName} room={room} disconnect={() => setEnterRoom(false)} />
            ) : (
                <>
                    <PreJoin onSubmit={() => setEnterRoom(true)} />
                </>
            )}
        </div>
    );
} 