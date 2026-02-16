"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Vertex shader: fullscreen quad in clip space (no projection needed)
const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    // Place quad directly in clip space — always fills the entire screen
    gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0);
}
`;

// Fragment shader: screen-space gradient + static stars + subtle parallax
const fragmentShader = `
varying vec2 vUv;
uniform vec2 resolution;
uniform float cameraY;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Screen UV with subtle parallax offset based on camera Y
    // The parallax factor is very small — like looking at a wall 1m away
    float parallaxAmount = cameraY * 0.003;
    vec2 uv = vUv;
    uv.y += parallaxAmount;

    // === SKY GRADIENT ===
    // Bottom: deep navy horizon | Top: dark midnight/black
    vec3 colorHorizon = vec3(0.08, 0.12, 0.25);   // Deep navy blue
    vec3 colorMid     = vec3(0.03, 0.05, 0.15);    // Midnight blue
    vec3 colorZenith  = vec3(0.01, 0.01, 0.05);    // Near black

    vec3 color;
    if (uv.y < 0.4) {
        // Lower portion: horizon to mid
        float t = smoothstep(0.0, 0.4, uv.y);
        color = mix(colorHorizon, colorMid, t);
    } else {
        // Upper portion: mid to zenith
        float t = smoothstep(0.4, 1.0, uv.y);
        color = mix(colorMid, colorZenith, t);
    }

    // Subtle atmosphere glow near horizon
    float atmosphere = exp(-uv.y * 5.0) * 0.15;
    color += vec3(atmosphere * 0.3, atmosphere * 0.4, atmosphere * 0.8);

    // === STATIC STARS ===
    // Stars are based on screen pixel position (NOT world position)
    // so they never move regardless of camera movement
    vec2 starCoord = floor(gl_FragCoord.xy / 1.5); // Grid cells for stars
    float starNoise = random(starCoord);

    // Only show stars above ~25% of screen height (avoid horizon clutter)
    float starFade = smoothstep(0.2, 0.5, uv.y);

    // Different star densities for different sizes
    // Small dim stars (many)
    if (starNoise > 0.992) {
        float brightness = (starNoise - 0.992) / (1.0 - 0.992);
        color += vec3(brightness * 0.5 * starFade);
    }

    // Larger brighter stars (few) — use a different grid
    vec2 bigStarCoord = floor(gl_FragCoord.xy / 4.0);
    float bigStarNoise = random(bigStarCoord + vec2(100.0, 200.0));
    if (bigStarNoise > 0.998) {
        float brightness = (bigStarNoise - 0.998) / (1.0 - 0.998);
        // Slight color tint for big stars
        vec3 starColor = mix(vec3(1.0, 0.9, 0.8), vec3(0.8, 0.9, 1.0), random(bigStarCoord));
        color += starColor * brightness * 0.8 * starFade;
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

export default function DynamicBackground() {
    const meshRef = useRef<THREE.Mesh>(null);
    const { size } = useThree();

    const uniforms = useMemo(
        () => ({
            resolution: { value: new THREE.Vector2(size.width, size.height) },
            cameraY: { value: 0.0 },
        }),
        [] // eslint-disable-line react-hooks/exhaustive-deps
    );

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            // Update resolution if window resizes
            material.uniforms.resolution.value.set(
                state.gl.domElement.width,
                state.gl.domElement.height
            );
            // Pass camera Y for subtle parallax
            material.uniforms.cameraY.value = state.camera.position.y;
        }
    });

    return (
        <mesh ref={meshRef} frustumCulled={false} renderOrder={-9999}>
            {/* Simple 1x1 plane — vertex shader stretches it to fullscreen */}
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                depthWrite={false}
                depthTest={false}
                side={THREE.FrontSide}
            />
        </mesh>
    );
}
