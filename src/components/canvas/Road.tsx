"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { BTC_HISTORY } from "@/data/mockData";
import { normalizeData, createRoadCurve } from "@/utils/math";

export default function Road() {
    const curve = useMemo(() => {
        // 1. Normalize price data to a reasonable height (0 to 50 units)
        const normalizedPrices = normalizeData(BTC_HISTORY, 0, 50);
        // 2. Create a 3D spline curve
        return createRoadCurve(normalizedPrices, 5); // 5 units distance between data points
    }, []);

    const geometry = useMemo(() => {
        // 3. Define the shape to extrude (the road profile)
        // A flat ribbon approx 6 units wide
        const shape = new THREE.Shape();
        shape.moveTo(0, -0.5);
        shape.lineTo(0, 0.5); // Thickness
        shape.lineTo(6, 0.5); // Width
        shape.lineTo(6, -0.5);
        shape.lineTo(0, -0.5);

        // 4. Extrude options
        const extrudeSettings = {
            steps: 200, // Resolution of the curve
            bevelEnabled: false,
            extrudePath: curve,
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [curve]);

    return (
        <group>
            {/* 
        Physics Body: Type "fixed" because the road doesn't move.
        Colliders: "trimesh" for exact geometry matching.
      */}
            <RigidBody type="fixed" colliders="trimesh">
                <mesh geometry={geometry} receiveShadow castShadow>
                    <meshStandardMaterial
                        color="#8800ff"
                        emissive="#330066"
                        emissiveIntensity={0.5}
                        roughness={0.4}
                        metalness={0.6}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </RigidBody>

            {/* Launchpad (Safety Start Zone) */}
            <RigidBody type="fixed" friction={2}>
                <mesh position={[-10, -1, 0]} receiveShadow>
                    <boxGeometry args={[20, 1, 10]} />
                    <meshStandardMaterial color="#444" />
                </mesh>
            </RigidBody>
        </group>
    );
}
