import { create } from 'zustand';

// Import individual coin history files
import BTC_HISTORY from '@/data/btc_history.json';
import ETH_HISTORY from '@/data/eth_history.json';
import SOL_HISTORY from '@/data/solana_history.json';
import DOGE_HISTORY from '@/data/doge_history.json';
import PEPE_HISTORY from '@/data/pepe_history.json';

// Coin data mapping
export const COIN_DATA: Record<string, typeof BTC_HISTORY> = {
    BTC: BTC_HISTORY,
    ETH: ETH_HISTORY,
    SOL: SOL_HISTORY,
    DOGE: DOGE_HISTORY,
    PEPE: PEPE_HISTORY,
};

// Available coins
export const AVAILABLE_COINS = Object.keys(COIN_DATA);

interface GameState {
    // Game Phase
    gamePhase: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

    // Menu Selection (Coin only, no year range)
    selectedCoin: string;

    // Track State
    currentTrackData: typeof BTC_HISTORY;

    // Physics State
    speed: number;
    distance: number;

    // Economic State
    currentPrice: number;
    initialPortfolio: number;
    currentPortfolio: number;

    // Actions
    selectCoin: (coin: string) => void;
    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    backToMenu: () => void;
    restartGame: () => void;
    setSpeed: (speed: number) => void;
    setGameOver: (isGameOver: boolean) => void;
    triggerGameOver: (reason: 'LIQUIDATED' | 'CRASHED') => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    gamePhase: 'MENU',

    // Default Selection
    selectedCoin: 'BTC',

    // Track data - starts with BTC
    currentTrackData: BTC_HISTORY,

    speed: 0,
    distance: 0,

    currentPrice: 0,
    initialPortfolio: 10000,
    currentPortfolio: 10000,

    selectCoin: (coin) => {
        const data = COIN_DATA[coin];
        if (data) {
            set({
                selectedCoin: coin,
                currentTrackData: data,
            });
        }
    },

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

    setGameOver: (isGameOver) => {
        if (isGameOver) set({ gamePhase: 'GAME_OVER' });
    },
    triggerGameOver: (reason) => {
        console.log(`Game Over: ${reason}`);
        set({ gamePhase: 'GAME_OVER' });
    }
}));
