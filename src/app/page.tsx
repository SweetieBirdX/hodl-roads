'use client';

import dynamic from 'next/dynamic';
import Loading from '@/components/ui/Loading';

// Dynamically import Scene to avoid SSR issues with R3F specifically in Next.js
const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
  loading: () => <Loading />
});

export default function Home() {
  return (
    <main className="h-screen w-full relative bg-black overflow-hidden">
      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pointer-events-none p-10 text-white">
        <h1 className="text-4xl font-bold tracking-tighter">HODL ROADS - ALPHA</h1>
      </div>

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>
    </main>
  );
}
