"use client";

import { useGameStore } from "@/store/useGameStore";

export default function PauseMenu() {
    const resumeGame = useGameStore((s) => s.resumeGame);
    const restartGame = useGameStore((s) => s.restartGame);
    const backToMenu = useGameStore((s) => s.backToMenu);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            {/* Paused Title */}
            <h1 className="text-5xl font-black text-white mb-12 tracking-widest">
                PAUSED
            </h1>

            {/* Menu Options */}
            <div className="flex flex-col gap-4 w-64">
                <button
                    onClick={resumeGame}
                    className="
                        px-8 py-4 rounded-lg font-bold text-lg uppercase tracking-wider
                        bg-cyan-600 text-white
                        hover:bg-cyan-500 hover:scale-105
                        transition-all duration-200
                    "
                >
                    Continue
                </button>

                <button
                    onClick={restartGame}
                    className="
                        px-8 py-4 rounded-lg font-bold text-lg uppercase tracking-wider
                        bg-gray-700 text-gray-200
                        hover:bg-gray-600 hover:scale-105
                        transition-all duration-200
                    "
                >
                    Restart
                </button>

                <button
                    onClick={backToMenu}
                    className="
                        px-8 py-4 rounded-lg font-bold text-lg uppercase tracking-wider
                        bg-gray-800 text-gray-400 border border-gray-700
                        hover:bg-gray-700 hover:text-white hover:scale-105
                        transition-all duration-200
                    "
                >
                    Main Menu
                </button>
            </div>
        </div>
    );
}
