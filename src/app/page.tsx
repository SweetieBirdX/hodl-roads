import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="h-screen w-full relative bg-neutral-900 overflow-hidden">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none text-white">
        <h1 className="text-4xl font-bold tracking-tighter">HODL ROADS</h1>
        <p className="text-sm opacity-50 mt-2">Loading Assets...</p>
      </div>
      {/* 
         TODO: Add Scene Component here 
         <Suspense fallback={null}>
            <Scene />
         </Suspense>
       */}
    </main>
  );
}
