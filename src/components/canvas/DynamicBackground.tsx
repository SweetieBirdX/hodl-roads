"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShader = `
varying vec3 vWorldPosition;
uniform vec3 colorSkyHorizon;
uniform vec3 colorSkyZenith;
uniform vec3 colorGroundHorizon;
uniform vec3 colorGroundDeep;
uniform float horizonY;
uniform float rangeY; // Range over which color transitions

void main() {
    float y = vWorldPosition.y - horizonY;
    vec3 color;

    if (y >= 0.0) {
        // Sky: Mix from horizon to zenith
        float t = smoothstep(0.0, rangeY, y);
        // Ease In (slow start) - keep horizon color longer
        t = t * t; 
        color = mix(colorSkyHorizon, colorSkyZenith, t);
    } else {
        // Ground: Mix from horizon to deep
        float t = smoothstep(0.0, rangeY, -y);
        t = t * t;
        color = mix(colorGroundHorizon, colorGroundDeep, t);
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

export default function DynamicBackground() {
    const meshRef = useRef<THREE.Mesh>(null);

    const uniforms = useMemo(
        () => ({
            colorSkyHorizon: { value: new THREE.Color("#4A90E2") }, // More vibrant Sky Blue
            colorSkyZenith: { value: new THREE.Color("#00005C") },  // Deep Dark Blue, not Black
            colorGroundHorizon: { value: new THREE.Color("#7ED321") }, // Vibrant Green
            colorGroundDeep: { value: new THREE.Color("#004D00") },    // Deep Green, not Black
            horizonY: { value: 0.0 },
            rangeY: { value: 1000.0 }, // Much slower transition (darkens after 1000 units)
        }),
        []
    );

    useFrame((state) => {
        if (meshRef.current) {
            // Keep background centered on camera so it feels infinite
            meshRef.current.position.copy(state.camera.position);
        }
    });

    return (
        <mesh ref={meshRef} scale={[1, 1, 1]}>
            {/* Massive sphere to ensure it covers far distance */}
            <sphereGeometry args={[4000, 64, 64]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                side={THREE.BackSide}
                depthWrite={false} // Don't write to depth buffer so it's always "behind"

            />
        </mesh>
    );
}
