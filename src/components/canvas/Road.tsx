"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { BTC_HISTORY } from "@/data/mockData";

export default function Road() {
    const { geometry, extrudePath } = useMemo(() => {
        // 1. Map Data to Vector3 Points
        const points = BTC_HISTORY.map((price, i) => {
            // X: Distance (Spread out)
            // Y: Price (Scaled down height)
            // Z: 0 (2.5D Logic)
            return new THREE.Vector3(i * 5, (price - 100) * 0.1, 0);
        });

        // 2. Create Smooth Curve
        const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

        // 3. Define Road Shape (Cross-section)
        const shape = new THREE.Shape();
        const width = 6;
        const thickness = 1;

        shape.moveTo(-width / 2, -thickness);
        shape.lineTo(-width / 2, 0);
        shape.lineTo(width / 2, 0);
        shape.lineTo(width / 2, -thickness);
        shape.lineTo(-width / 2, -thickness);

        // 4. Extrude Geometry
        const extrudeSettings = {
            steps: points.length * 10, // High resolution
            bevelEnabled: false,
            extrudePath: curve,
        };

        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Center the geometry so physics align
        geo.center();

        return { geometry: geo, extrudePath: curve };
    }, []);

    return (
        <group>
            {/* ROAD MESH & PHYSICS */}
            {/* 
                We use 'trimesh' to perfectly match the extruded geometry directly.
                For static terrain, trimesh is fine and precise.
             */}
            <RigidBody type="fixed" colliders="trimesh" friction={1} restitution={0.2}>
                <mesh geometry={geometry} receiveShadow castShadow>
                    <meshStandardMaterial
                        color="#2c3e50"
                        roughness={0.8}
                        metalness={0.2}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </RigidBody>

            {/* DECORATIONS: Grid Lines on top? (Optional, maybe later) */}
        </group>
    );
}
