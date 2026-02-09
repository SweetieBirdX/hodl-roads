"use client";

import { useGameStore } from "@/store/useGameStore";

export default function TurboBar() {
    const turboFuel = useGameStore((s) => s.turboFuel);
    const isTurboActive = useGameStore((s) => s.isTurboActive);

    return (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
            <div className="flex flex-col items-end gap-1">
                {/* Label */}
                <span className={`text-xs font-mono ${isTurboActive ? 'text-orange-400' : 'text-neutral-500'}`}>
                    {isTurboActive ? '🔥 TURBO' : 'TURBO'}
                </span>

                {/* Bar Container */}
                <div className="w-32 h-3 bg-neutral-800/80 rounded-full overflow-hidden">
                    {/* Fuel Fill */}
                    <div
                        className={`h-full rounded-full transition-all duration-100 ${isTurboActive
                                ? 'bg-orange-500'
                                : turboFuel < 20
                                    ? 'bg-red-500'
                                    : 'bg-white'
                            }`}
                        style={{ width: `${turboFuel}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
