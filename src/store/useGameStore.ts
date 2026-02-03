import { create } from 'zustand';
import CRYPTO_HISTORY from '@/data/cryptoHistory.json';

type TrackKey = keyof typeof CRYPTO_HISTORY;

interface GameState {
    status: 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'WON';

    // Track State
    selectedTrackKey: TrackKey;
    currentTrackData: typeof CRYPTO_HISTORY[TrackKey];

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
    setTrack: (key: string) => void;
    setGameOver: (isGameOver: boolean) => void;
    triggerGameOver: (reason: 'LIQUIDATED' | 'CRASHED') => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    status: 'IDLE',

    selectedTrackKey: 'BTC_2021',
    // Initialize with default track data
    currentTrackData: CRYPTO_HISTORY['BTC_2021'],

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

    setTrack: (key) => {
        // Validate key
        if (Object.keys(CRYPTO_HISTORY).includes(key)) {
            const trackKey = key as TrackKey;
            set({
                selectedTrackKey: trackKey,
                currentTrackData: CRYPTO_HISTORY[trackKey],
                // Reset game state on track change
                status: 'IDLE',
                speed: 0,
                distance: 0
            });
        }
    },

    setGameOver: (isGameOver) => {
        if (isGameOver) set({ status: 'GAME_OVER' });
    },
    triggerGameOver: (reason) => {
        console.log(`Game Over: ${reason}`);
        set({ status: 'GAME_OVER' });
    }
}));
