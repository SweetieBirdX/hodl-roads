"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useGameStore } from "@/store/useGameStore";

export default function Road() {
    // Read current track data from store
    const trackData = useGameStore((state) => state.currentTrackData);

    const { geometry, extrudePath } = useMemo(() => {
        if (!trackData || trackData.length < 2) {
            // Fallback or loading state
            return { geometry: null, extrudePath: null };
        }

        // 1. Map Data to Vector3 Points
        // Data format: { x, y, price, date }
        const points = trackData.map((p) => {
            return new THREE.Vector3(p.x, p.y, 0);
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

        // DO NOT Center the geometry. We want x:0 to be World x:0.
        // geo.center();

        return { geometry: geo, extrudePath: curve };
    }, [trackData]);

    if (!geometry) return null;

    return (
        <group>
            {/* ROAD MESH & PHYSICS */}
            {/* Key ensures Rapier rebuilds collider when data changes (using first date as key) */}
            <RigidBody key={trackData[0].date} type="fixed" colliders="trimesh" friction={1} restitution={0.2}>
                <mesh geometry={geometry} receiveShadow castShadow>
                    <meshStandardMaterial
                        color="#2c3e50"
                        roughness={0.8}
                        metalness={0.2}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </RigidBody>
        </group>
    );
}
