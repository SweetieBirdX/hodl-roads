"use client";

import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
    "Loading game data...",
    "Generating roads...",
    "Calibrating physics...",
    "Preparing vehicle...",
];

export default function Loading() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full w-full items-center justify-center bg-neutral-950">
            {/* Spinning Loader */}
            <div className="w-12 h-12 border-4 border-neutral-700 border-t-white rounded-full animate-spin mb-6" />

            {/* Loading Message */}
            <p className="text-neutral-400 text-sm">
                {LOADING_MESSAGES[messageIndex]}
            </p>
        </div>
    );
}
