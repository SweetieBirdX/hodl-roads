import { create } from 'zustand';
import CRYPTO_HISTORY from '@/data/cryptoHistory.json';

type TrackKey = keyof typeof CRYPTO_HISTORY;

interface GameState {
    // Game Phase
    gamePhase: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

    // Menu Selection
    selectedCoin: string;
    selectedYearStart: number;
    selectedYearEnd: number;

    // Track State (Legacy - will be updated when Road changes)
    selectedTrackKey: TrackKey;
    currentTrackData: typeof CRYPTO_HISTORY[TrackKey];

    // Physics State
    speed: number;
    distance: number;

    // Economic State
    currentPrice: number;
    initialPortfolio: number;
    currentPortfolio: number;

    // Actions
    setSelection: (coin: string, yearStart: number, yearEnd: number) => void;
    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    backToMenu: () => void;
    restartGame: () => void;
    setSpeed: (speed: number) => void;
    setTrack: (key: string) => void;
    setGameOver: (isGameOver: boolean) => void;
    triggerGameOver: (reason: 'LIQUIDATED' | 'CRASHED') => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    gamePhase: 'MENU',

    // Default Selection
    selectedCoin: 'BTC',
    selectedYearStart: 2021,
    selectedYearEnd: 2022,

    // Legacy track state
    selectedTrackKey: 'BTC_2021',
    currentTrackData: CRYPTO_HISTORY['BTC_2021'],

    speed: 0,
    distance: 0,

    currentPrice: 0,
    initialPortfolio: 10000,
    currentPortfolio: 10000,

    setSelection: (coin, yearStart, yearEnd) => set({
        selectedCoin: coin,
        selectedYearStart: yearStart,
        selectedYearEnd: yearEnd
    }),

    startGame: () => set({
        gamePhase: 'PLAYING',
        speed: 0,
        distance: 0
    }),

    pauseGame: () => set({ gamePhase: 'PAUSED' }),

    resumeGame: () => set({ gamePhase: 'PLAYING' }),

    backToMenu: () => set({
        gamePhase: 'MENU',
        speed: 0,
        distance: 0
    }),

    restartGame: () => set({
        gamePhase: 'MENU',
        speed: 0,
        distance: 0,
        initialPortfolio: 10000,
        currentPortfolio: 10000
    }),

    setSpeed: (speed) => set({ speed }),

    setTrack: (key) => {
        if (Object.keys(CRYPTO_HISTORY).includes(key)) {
            const trackKey = key as TrackKey;
            set({
                selectedTrackKey: trackKey,
                currentTrackData: CRYPTO_HISTORY[trackKey],
                speed: 0,
                distance: 0
            });
        }
    },

    setGameOver: (isGameOver) => {
        if (isGameOver) set({ gamePhase: 'GAME_OVER' });
    },
    triggerGameOver: (reason) => {
        console.log(`Game Over: ${reason}`);
        set({ gamePhase: 'GAME_OVER' });
    }
}));
