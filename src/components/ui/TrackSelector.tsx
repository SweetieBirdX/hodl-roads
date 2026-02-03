"use client";

import { useGameStore } from "@/store/useGameStore";
import CRYPTO_HISTORY from "@/data/cryptoHistory.json";

export default function TrackSelector() {
    const selectedTrackKey = useGameStore((state) => state.selectedTrackKey);
    const setTrack = useGameStore((state) => state.setTrack);
    const restartGame = useGameStore((state) => state.restartGame);

    const trackOptions = Object.keys(CRYPTO_HISTORY);

    return (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 pointer-events-auto">
            {/* Cyberpunk Container */}
            <div className="flex items-center bg-black/80 border border-cyan-500/50 p-2 rounded backdrop-blur-md">
                <span className="text-cyan-400 text-xs font-mono mr-2 uppercase tracking-widest">
                    TRACK
                </span>

                <select
                    value={selectedTrackKey}
                    onChange={(e) => setTrack(e.target.value)}
                    className="bg-black text-white font-bold font-mono outline-none border-none cursor-pointer hover:text-cyan-300 transition-colors uppercase"
                >
                    {trackOptions.map((key) => (
                        <option key={key} value={key}>
                            {key.replace('_', ' ')}
                        </option>
                    ))}
                </select>
            </div>

            {/* Reset Button */}
            <button
                onClick={restartGame}
                className="bg-red-900/80 hover:bg-red-700/80 text-white font-mono text-xs px-3 py-2 rounded border border-red-500/50 backdrop-blur-md transition-all uppercase tracking-wider"
            >
                RESET CAR
            </button>
        </div>
    );
}
