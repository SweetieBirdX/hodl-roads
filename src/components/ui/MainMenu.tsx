"use client";

import { useGameStore } from "@/store/useGameStore";

// Available coins (will be expanded when more data is added)
const COINS = ["BTC", "DOGE", "ETH", "SOL"];

// Available years (2010-2026)
const YEARS = Array.from({ length: 17 }, (_, i) => 2010 + i);

export default function MainMenu() {
    const selectedCoin = useGameStore((s) => s.selectedCoin);
    const selectedYearStart = useGameStore((s) => s.selectedYearStart);
    const selectedYearEnd = useGameStore((s) => s.selectedYearEnd);
    const setSelection = useGameStore((s) => s.setSelection);
    const startGame = useGameStore((s) => s.startGame);

    const handleCoinSelect = (coin: string) => {
        setSelection(coin, selectedYearStart, selectedYearEnd);
    };

    const handleYearStartChange = (year: number) => {
        const newEnd = Math.max(year, selectedYearEnd);
        setSelection(selectedCoin, year, newEnd);
    };

    const handleYearEndChange = (year: number) => {
        const newStart = Math.min(year, selectedYearStart);
        setSelection(selectedCoin, newStart, year);
    };

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
                Drive Through History
            </p>

            {/* Coin Selection */}
            <div className="mb-8">
                <p className="text-cyan-400 text-xs uppercase tracking-widest mb-3 text-center">
                    Select Coin
                </p>
                <div className="flex gap-3">
                    {COINS.map((coin) => (
                        <button
                            key={coin}
                            onClick={() => handleCoinSelect(coin)}
                            className={`
                                px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200
                                border-2 backdrop-blur-sm
                                ${selectedCoin === coin
                                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/25'
                                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                                }
                            `}
                        >
                            {coin}
                        </button>
                    ))}
                </div>
            </div>

            {/* Year Range Selection */}
            <div className="mb-12">
                <p className="text-purple-400 text-xs uppercase tracking-widest mb-3 text-center">
                    Year Range
                </p>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedYearStart}
                        onChange={(e) => handleYearStartChange(Number(e.target.value))}
                        className="bg-gray-800/80 border-2 border-purple-500/50 text-white px-4 py-3 rounded-lg text-lg font-mono cursor-pointer hover:border-purple-400 transition-colors"
                    >
                        {YEARS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <span className="text-purple-400 text-2xl">→</span>

                    <select
                        value={selectedYearEnd}
                        onChange={(e) => handleYearEndChange(Number(e.target.value))}
                        className="bg-gray-800/80 border-2 border-purple-500/50 text-white px-4 py-3 rounded-lg text-lg font-mono cursor-pointer hover:border-purple-400 transition-colors"
                    >
                        {YEARS.filter(y => y >= selectedYearStart).map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
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
                🚀 Start Driving
            </button>

            {/* Selection Preview */}
            <p className="mt-8 text-gray-500 text-sm">
                {selectedCoin} • {selectedYearStart} - {selectedYearEnd}
            </p>
        </div>
    );
}
