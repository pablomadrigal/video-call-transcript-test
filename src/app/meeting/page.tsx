"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MeetingPage() {
    const [roomCode, setRoomCode] = useState('');
    const router = useRouter();

    // Handler for creating a new meeting
    const handleNewMeeting = () => {
        const newRoom = `${Math.random().toString(36).substring(2, 8)}`;
        router.push(`/meeting/${newRoom}`);
    };

    // Handler for joining a meeting by code
    const handleJoin = () => {
        if (roomCode.trim()) {
            router.push(`/meeting/${roomCode.trim()}`);
        }
    };



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <h1 className="text-4xl font-semibold text-center mb-2">Video calls and meetings for everyone</h1>
            <p className="text-lg text-center text-gray-600 mb-8">Connect, collaborate, and celebrate from anywhere with our app.</p>
            <div className="flex gap-4 mb-8">
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full flex items-center gap-2 shadow"
                    onClick={handleNewMeeting}
                >
                    New Meeting
                </button>
                <input
                    type="text"
                    placeholder="Enter a code or link"
                    className="border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value)}
                />
                <button
                    className="text-gray-400 font-medium py-3 px-6 rounded-full border border-gray-200 cursor-pointer disabled:opacity-50"
                    onClick={handleJoin}
                    disabled={!roomCode.trim()}
                >
                    Join
                </button>
            </div>
            <hr className="w-full max-w-xl border-t border-gray-200" />
        </div>
    );
} 