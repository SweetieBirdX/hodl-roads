"use client";

import { useGameStore, AVAILABLE_COINS } from "@/store/useGameStore";

export default function MainMenu() {
    const selectedCoin = useGameStore((s) => s.selectedCoin);
    const selectCoin = useGameStore((s) => s.selectCoin);
    const startGame = useGameStore((s) => s.startGame);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950">
            {/* Title */}
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                HODL ROADS
            </h1>
            <p className="text-neutral-500 text-sm mb-16">
                Drive through crypto history
            </p>

            {/* Coin Selection */}
            <div className="mb-12">
                <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4 text-center">
                    Select Coin
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {AVAILABLE_COINS.map((coin) => (
                        <button
                            key={coin}
                            onClick={() => selectCoin(coin)}
                            className={`
                                px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-150
                                ${selectedCoin === coin
                                    ? 'bg-white text-black'
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }
                            `}
                        >
                            {coin}
                        </button>
                    ))}
                </div>
            </div>

            {/* Start Button */}
            <button
                onClick={startGame}
                className="
                    px-10 py-3 rounded-lg font-semibold text-lg
                    bg-white text-black
                    hover:bg-neutral-200
                    transition-colors duration-150
                "
            >
                Start
            </button>
        </div>
    );
}
