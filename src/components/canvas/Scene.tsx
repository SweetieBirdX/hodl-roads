"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, Environment } from "@react-three/drei";
import Vehicle from "./Vehicle";
import Road from "./Road";

// Keyboard control mappings
const keyboardMap = [
    { name: "forward", keys: ["KeyW", "ArrowUp"] },
    { name: "backward", keys: ["KeyS", "ArrowDown"] },
    { name: "left", keys: ["KeyA", "ArrowLeft"] },
    { name: "right", keys: ["KeyD", "ArrowRight"] },
    { name: "reset", keys: ["KeyR"] },
];

export default function Scene() {
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

                <Physics gravity={[0, -9.81, 0]} timeStep="vary">
                    <group position={[0, -2, 0]}>
                        {/* 
                           Shift entire world slightly if needed, 
                           or ensure Vehicle spawns correctly relative to Road 
                        */}
                        <Road />

                        {/* Vehicle Spawn:
                            Road starts at X=0. 
                            Let's spawn vehicle slightly above the first point.
                            Mock Data start: Price 100 -> (100-100)*0.1 = Y=0.
                        */}
                        <group position={[0, 5, 0]}>
                            <Vehicle />
                        </group>
                    </group>
                </Physics>
            </Canvas>
        </KeyboardControls>
    );
}
