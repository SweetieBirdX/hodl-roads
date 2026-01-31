import { create } from 'zustand';

interface GameState {
    status: 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'WON';

    // Physics State
    speed: number;        // Current vehicle speed
    distance: number;     // Progress along the road (0-100%)

    // Economic State
    currentPrice: number; // The Y-value of the road at current position
    initialPortfolio: number;
    currentPortfolio: number; // Decreases if cargo takes damage (optional)

    // Actions
    startGame: () => void;
    restartGame: () => void;
    setSpeed: (speed: number) => void;
    triggerGameOver: (reason: 'LIQUIDATED' | 'CRASHED') => void;
}

export const useGameStore = create<GameState>((set) => ({
    status: 'IDLE',

    speed: 0,
    distance: 0,

    currentPrice: 0,
    initialPortfolio: 10000,
    currentPortfolio: 10000,

    startGame: () => set({ status: 'PLAYING' }),
    restartGame: () => set({
        status: 'IDLE',
        speed: 0,
        distance: 0,
        initialPortfolio: 10000,
        currentPortfolio: 10000
    }),
    setSpeed: (speed) => set({ speed }),
    triggerGameOver: (reason) => {
        console.log(`Game Over: ${reason}`); // Optional: logging for debug
        set({ status: 'GAME_OVER' });
    }
}));
