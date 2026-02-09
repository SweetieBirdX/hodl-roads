"use client";

import { useGameStore, AVAILABLE_COINS } from "@/store/useGameStore";

export default function MainMenu() {
    const selectedCoin = useGameStore((s) => s.selectedCoin);
    const selectCoin = useGameStore((s) => s.selectCoin);
    const startGame = useGameStore((s) => s.startGame);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Title */}
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-2 tracking-tighter">
                HODL ROADS
            </h1>
            <p className="text-gray-400 text-sm mb-12 tracking-widest uppercase">
                Drive Through Crypto History
            </p>

            {/* Coin Selection */}
            <div className="mb-12">
                <p className="text-cyan-400 text-xs uppercase tracking-widest mb-4 text-center">
                    Select Your Coin
                </p>
                <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                    {AVAILABLE_COINS.map((coin) => (
                        <button
                            key={coin}
                            onClick={() => selectCoin(coin)}
                            className={`
                                px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200
                                border-2 backdrop-blur-sm min-w-[100px]
                                ${selectedCoin === coin
                                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/25 scale-110'
                                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white hover:scale-105'
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
                    px-12 py-4 rounded-xl font-black text-xl uppercase tracking-widest
                    bg-gradient-to-r from-cyan-500 to-purple-600
                    text-white shadow-2xl shadow-purple-500/30
                    hover:shadow-cyan-500/40 hover:scale-105
                    transition-all duration-300
                    border border-white/20
                "
            >
                Start Driving
            </button>
        </div>
    );
}
