"use client";

import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { KeyboardControls, Environment } from "@react-three/drei";
import Vehicle from "./Vehicle";

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
            <Canvas shadows camera={{ position: [0, 5, 20], fov: 50 }}>
                {/* Lighting & Env */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <Environment preset="sunset" />

                <Physics gravity={[0, -9.81, 0]}>
                    {/* The Vehicle */}
                    <Vehicle />

                    {/* --- TERRAIN (Simple Hill Climb Track) --- */}

                    {/* 1. Start Platform */}
                    <RigidBody type="fixed" friction={1}>
                        <mesh position={[-10, 0, 0]} receiveShadow>
                            <boxGeometry args={[40, 1, 10]} />
                            <meshStandardMaterial color="#444" />
                        </mesh>
                    </RigidBody>

                    {/* 2. First Ramp */}
                    <RigidBody type="fixed" friction={1} position={[20, 2, 0]} rotation={[0, 0, 0.2]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[20, 1, 10]} />
                            <meshStandardMaterial color="#555" />
                        </mesh>
                    </RigidBody>

                    {/* 3. Flat Top */}
                    <RigidBody type="fixed" friction={1} position={[40, 4, 0]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[20, 1, 10]} />
                            <meshStandardMaterial color="#444" />
                        </mesh>
                    </RigidBody>

                    {/* 4. Downhill */}
                    <RigidBody type="fixed" friction={1} position={[60, 2, 0]} rotation={[0, 0, -0.3]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[25, 1, 10]} />
                            <meshStandardMaterial color="#555" />
                        </mesh>
                    </RigidBody>

                    {/* 5. Bump Section */}
                    <RigidBody type="fixed" friction={1} position={[80, 0, 0]}>
                        <mesh receiveShadow>
                            {/* A few bumps */}
                            <boxGeometry args={[30, 1, 10]} />
                            <meshStandardMaterial color="#444" />
                        </mesh>
                    </RigidBody>
                    <RigidBody type="fixed" friction={1} position={[75, 1, 0]}>
                        <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[1, 1, 10, 16]} />
                            <meshStandardMaterial color="#666" />
                        </mesh>
                    </RigidBody>
                    <RigidBody type="fixed" friction={1} position={[85, 1, 0]}>
                        <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[1.5, 1.5, 10, 16]} />
                            <meshStandardMaterial color="#666" />
                        </mesh>
                    </RigidBody>

                    {/* 6. Big Jump Ramp */}
                    <RigidBody type="fixed" friction={1} position={[110, 5, 0]} rotation={[0, 0, 0.5]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[30, 1, 10]} />
                            <meshStandardMaterial color="#777" />
                        </mesh>
                    </RigidBody>

                    {/* 7. Landing Pad (Far away) */}
                    <RigidBody type="fixed" friction={1} position={[160, 0, 0]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[50, 1, 10]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                    </RigidBody>

                </Physics>
            </Canvas>
        </KeyboardControls>
    );
}
