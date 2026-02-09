"use client";

import { useMemo, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, Environment } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";
import Vehicle from "./Vehicle";
import Road from "./Road";

// Keyboard control mappings
const keyboardMap = [
    { name: "forward", keys: ["KeyW", "ArrowUp"] },
    { name: "backward", keys: ["KeyS", "ArrowDown"] },
    { name: "left", keys: ["KeyA", "ArrowLeft"] },
    { name: "right", keys: ["KeyD", "ArrowRight"] },
    { name: "reset", keys: ["KeyR"] },
    { name: "turbo", keys: ["ShiftLeft", "ShiftRight"] },
];

export default function Scene() {
    const trackData = useGameStore((state) => state.currentTrackData);
    const gamePhase = useGameStore((state) => state.gamePhase);

    // Track if tab is visible
    const [isTabVisible, setIsTabVisible] = useState(true);

    // Listen for visibility changes (tab switching)
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Pause physics when game is paused OR tab is not visible
    const isPaused = gamePhase === 'PAUSED' || !isTabVisible;

    // Calculate Spawn Position dynamically
    const startPos = useMemo(() => {
        if (!trackData || trackData.length === 0) return [0, 5, 0] as [number, number, number];
        // SAFETY OFFSET: Start at index 6 (approx 30 units in) to avoid edge glitches
        const safeIndex = Math.min(6, trackData.length - 1);
        const spawnPoint = trackData[safeIndex];
        return [spawnPoint.x, spawnPoint.y + 5, 0] as [number, number, number]; // Drop from 5 units high
    }, [trackData]);

    return (
        <KeyboardControls map={keyboardMap}>
            <Canvas
                shadows
                dpr={[1, 2]}
                gl={{ antialias: true, stencil: false, depth: true }}
                camera={{ position: [0, 5, 20], fov: 50 }}
            >
                {/* Lighting & Env */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <Environment preset="city" />

                {/* Physics World - paused prop freezes simulation */}
                <Physics gravity={[0, -15, 0]} timeStep="vary" paused={isPaused}>
                    <group position={[0, -2, 0]}>
                        {/* 
                           Shift entire world slightly if needed, 
                           or ensure Vehicle spawns correctly relative to Road 
                        */}
                        <Road />

                        {/* Vehicle Spawn:
                            Spawn exactly at start of road data
                        */}
                        {trackData && (
                            <group position={[0, 0, 0]}>
                                {/* Key ensures vehicle resets when track changes */}
                                <Vehicle key={trackData[0].date} position={startPos} />
                            </group>
                        )}
                    </group>
                </Physics>
            </Canvas>
        </KeyboardControls>
    );
}
