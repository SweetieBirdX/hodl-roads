"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, Environment } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";
import Vehicle from "./Vehicle";
import Road from "./Road";
import DynamicBackground from "./DynamicBackground";

// Keyboard control mappings
const keyboardMap = [
    { name: "forward", keys: ["KeyW", "ArrowUp"] },
    { name: "backward", keys: ["KeyS", "ArrowDown"] },
    { name: "left", keys: ["KeyA", "ArrowLeft"] },
    { name: "right", keys: ["KeyD", "ArrowRight"] },
    { name: "reset", keys: ["KeyR"] },
    { name: "turbo", keys: ["ShiftLeft", "ShiftRight"] },
];

function Lights() {
    const lightRef = useRef<THREE.DirectionalLight>(null);
    const lightTarget = useRef<THREE.Object3D>(new THREE.Object3D());

    useFrame((state) => {
        if (lightRef.current) {
            const offset = new THREE.Vector3(10, 20, 10);
            const targetPos = state.camera.position.clone();
            lightRef.current.position.copy(targetPos).add(offset);
            lightRef.current.target.position.copy(targetPos);
            lightRef.current.target.updateMatrixWorld();
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight
                ref={lightRef}
                position={[10, 20, 10]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
                target={lightTarget.current}
            />
            <primitive object={lightTarget.current} />
        </>
    );
}

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
                camera={{ position: [0, 5, 20], fov: 50, far: 4000 }}
            >
                <Lights />

                {/* Background */}
                <DynamicBackground />
                <Environment preset="city" background={false} />

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
            </Canvas >
        </KeyboardControls >
    );
}
