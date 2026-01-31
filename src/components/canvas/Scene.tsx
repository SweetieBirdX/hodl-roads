"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import Road from "./Road";

export default function Scene() {
    return (
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
            {/* Lights */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />

            {/* Controls */}
            <OrbitControls />

            {/* Physics World */}
            <Physics debug={true}>
                {/* Road */}
                <Road />
            </Physics>
        </Canvas >
    );
}
