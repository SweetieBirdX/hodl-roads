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

// Simple pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    float y = vWorldPosition.y - horizonY;
    vec3 color;

    if (y >= 0.0) {
        // Sky: Mix from horizon to zenith
        float t = smoothstep(0.0, rangeY, y);
        
        // Atmosphere Glow: Add a subtle additive glow near horizon
        float atmosphere = exp(-y * 0.02) * 0.2; // Decay as we go up

        // Ease In for base color
        float tColor = t * t; 
        color = mix(colorSkyHorizon, colorSkyZenith, tColor);
        
        // Stars
        if (y > 200.0) { // Only show stars above 200 units
            // Map 3D position to 2D for noise (using X/Z)
            // Scale down to make stars smaller/denser
            vec2 pos = vWorldPosition.xz * 0.05 + vWorldPosition.xy * 0.01; 
            float noise = random(floor(pos));
            
            // Threshold for stars (0.995 = sparse stars)
            if (noise > 0.995) {
                float brightness = (noise - 0.995) / (1.0 - 0.995);
                // Twinkle based on position/time? For now static.
                // Fade in stars as we go higher
                float fade = smoothstep(200.0, 800.0, y);
                color += vec3(brightness * fade); 
            }
        }

        // Add atmosphere glow
        color += vec3(atmosphere * 0.5, atmosphere * 0.5, atmosphere * 0.7);

    } else {
        // Ground: Mix from horizon to deep
        float t = smoothstep(0.0, rangeY, -y);
        
        // Fog/Haze near horizon for ground too
        float haze = exp(y * 0.05) * 0.1;

        t = t * t;
        color = mix(colorGroundHorizon, colorGroundDeep, t);
        
        // Mix haze
        color = mix(color, colorGroundHorizon, haze);
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

export default function DynamicBackground() {
    const meshRef = useRef<THREE.Mesh>(null);

    const uniforms = useMemo(
        () => ({
            colorSkyHorizon: { value: new THREE.Color("#4A90E2") }, // Vibrant Sky Blue
            colorSkyZenith: { value: new THREE.Color("#00005C") },  // Deep Blue
            colorGroundHorizon: { value: new THREE.Color("#7ED321") }, // Vibrant Green
            colorGroundDeep: { value: new THREE.Color("#004D00") },    // Deep Green
            horizonY: { value: 0.0 },
            rangeY: { value: 1000.0 },
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
            {/* Reduced segment count for optimization (32x32 is plenty for a gradient sphere) */}
            <sphereGeometry args={[4000, 32, 32]} />
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
