'use client';

import dynamic from 'next/dynamic';
import Loading from '@/components/ui/Loading';
import MainMenu from '@/components/ui/MainMenu';
import PauseMenu from '@/components/ui/PauseMenu';
import TurboBar from '@/components/ui/TurboBar';
import TouchControls, { TouchResetButton } from '@/components/ui/TouchControls';
import { useGameStore } from '@/store/useGameStore';

// Dynamically import Scene to avoid SSR issues with R3F
const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
  loading: () => <Loading />
});

export default function Home() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const pauseGame = useGameStore((s) => s.pauseGame);

  return (
    <main className="h-screen w-full relative bg-black overflow-hidden">
      {/* Main Menu */}
      {gamePhase === 'MENU' && <MainMenu />}

      {/* Playing State */}
      {(gamePhase === 'PLAYING' || gamePhase === 'PAUSED') && (
        <>
          {/* 3D Scene */}
          <div className="absolute inset-0 z-0">
            <Scene />
          </div>

          {/* In-Game HUD */}
          <div className="absolute top-4 left-4 z-10 text-white pointer-events-none">
            <h1 className="text-2xl font-bold tracking-tighter opacity-50">HODL ROADS</h1>
          </div>

          {/* Pause & Reset Buttons (top-right) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <TouchResetButton />
            <button
              onClick={pauseGame}
              className="px-4 py-2 bg-neutral-800/80 text-white rounded-lg font-semibold hover:bg-neutral-700 transition-colors"
            >
              Pause
            </button>
          </div>

          {/* Control Instructions */}
          <div className="absolute bottom-4 left-4 z-10 text-neutral-500 text-xs font-mono pointer-events-none keyboard-instructions">
            <div className="flex flex-col gap-1 bg-black/50 p-3 rounded-lg">
              <div className="flex gap-2">
                <span className="bg-neutral-800 px-2 py-1 rounded text-white">W</span>
                <span>Accelerate</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-neutral-800 px-2 py-1 rounded text-white">S</span>
                <span>Brake</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-neutral-800 px-2 py-1 rounded text-white">A/D</span>
                <span>Tilt</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-neutral-800 px-2 py-1 rounded text-white">R</span>
                <span>Reset</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-neutral-800 px-2 py-1 rounded text-white">Shift</span>
                <span>Turbo</span>
              </div>
            </div>
          </div>

          {/* Turbo Bar */}
          <TurboBar />

          {/* Mobile Touch Controls */}
          <TouchControls />
        </>
      )}

      {/* Pause Menu Overlay */}
      {gamePhase === 'PAUSED' && <PauseMenu />}

      {/* Game Over Screen */}
      {gamePhase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
          <h1 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h1>
          <button
            onClick={() => useGameStore.getState().backToMenu()}
            className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-500 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      )}
    </main>
  );
}
