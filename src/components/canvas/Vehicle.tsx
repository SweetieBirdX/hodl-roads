"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, useRapier, CuboidCollider } from "@react-three/rapier";
import { Ray } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";

// --- VEHICLE CONFIGURATION ---
const CONFIG = {
    // Dimensions
    width: 2.2,
    length: 4.0,
    // Physics
    chassisMass: 300,      // HEAVIER body for stability
    restLength: 0.8,       // Suspension rest length
    suspensionTravel: 0.6, // How far wheels can move
    stiffness: 120,        // Softer springs
    damping: 20,           // Higher damping to stop bouncing
    rayLength: 1.5,        // Max ray distance (RestLength + Travel)
    wheelRadius: 0.5,
    // Drive
    engineForce: 100,      // Reduced to 100 as requested (Slower acceleration)
    brakingForce: 20,      // Smooth braking (reduced from 50)
    sideFriction: 200,     // Grip to prevent sliding
    maxSteer: 0,           // 2.5D game, no steering needed
    // Air Control
    airControlTorque: 200,  // Torque for tilting (Increased for ground control)
};

// Wheel Offsets (Relative to Chassis Center)
const WHEEL_OFFSETS = [
    { x: CONFIG.length / 2 - 0.6, z: -CONFIG.width / 2 + 0.4 }, // Front Left
    { x: CONFIG.length / 2 - 0.6, z: CONFIG.width / 2 - 0.4 },  // Front Right
    { x: -CONFIG.length / 2 + 0.6, z: -CONFIG.width / 2 + 0.4 },// Rear Left
    { x: -CONFIG.length / 2 + 0.6, z: CONFIG.width / 2 - 0.4 }, // Rear Right
];

interface VehicleProps {
    position?: [number, number, number];
}

export default function Vehicle({ position = [-10, 5, 0] }: VehicleProps) {
    const chassisRef = useRef<RapierRigidBody>(null);
    const { world } = useRapier();
    const [, get] = useKeyboardControls();
    const setSpeed = useGameStore((state) => state.setSpeed);
    const trackData = useGameStore((state) => state.currentTrackData);
    const setTurboFuel = useGameStore((state) => state.setTurboFuel);
    const setTurboActive = useGameStore((state) => state.setTurboActive);

    // Helper: Find road Y at given X position
    const getRoadYAtX = (x: number): number => {
        if (!trackData || trackData.length === 0) return 0;

        // Find the two closest points (before and after x)
        let before = trackData[0];
        let after = trackData[trackData.length - 1];

        for (let i = 0; i < trackData.length - 1; i++) {
            if (trackData[i].x <= x && trackData[i + 1].x >= x) {
                before = trackData[i];
                after = trackData[i + 1];
                break;
            }
        }

        // Linear interpolation between points
        const t = (after.x - before.x) !== 0
            ? (x - before.x) / (after.x - before.x)
            : 0;
        return before.y + t * (after.y - before.y);
    };

    // Visual Wheel Refs
    const flWheel = useRef<THREE.Group>(null);
    const frWheel = useRef<THREE.Group>(null);
    const rlWheel = useRef<THREE.Group>(null);
    const rrWheel = useRef<THREE.Group>(null);
    const wheelVisuals = [flWheel, frWheel, rlWheel, rrWheel];

    // Force Reset Physics when Level Changes (Teleporter Fix)
    // Effectively handled by useEffect below

    // NOTE: We used `useEffect` in the tool plan.
    // Let's implement it.

    // We need useEffect to run when `position` changes.
    // But `position` is an array [x,y,z], referential equality might fail if parent passes new array.
    // In Scene.tsx, startPos is useMemo'd, so it's stable if trackData is stable.

    // Physics Reset Logic

    // We already imported useEffect at top level

    useEffect(() => {
        if (chassisRef.current) {
            const [x, y, z] = position;
            chassisRef.current.setTranslation({ x, y, z }, true);
            chassisRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            chassisRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
    }, [position]);

    useFrame((state, rawDelta) => {
        // Cap delta to prevent physics jumps after tab switch (max ~20 FPS worth)
        const delta = Math.min(rawDelta, 0.05);

        if (!chassisRef.current) return;
        const chassis = chassisRef.current;
        const { forward, backward, left, right, reset, turbo } = get();

        // R KEY RESET: Place car 1 unit above the road at current X position
        if (reset) {
            const currentPos = chassis.translation();
            const roadY = getRoadYAtX(currentPos.x);
            // Teleport to road height + 10 (accounting for world offset of -2)
            chassis.setTranslation({ x: currentPos.x, y: roadY + 10 - 2, z: 0 }, true);
            // Zero out velocity
            chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
            chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
            // Reset rotation to upright (no roll/pitch)
            chassis.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
            return; // Skip rest of frame
        }

        // 1. Get Chassis State
        const transform = chassis.translation();
        const rotation = chassis.rotation();
        const chassisPos = new THREE.Vector3(transform.x, transform.y, transform.z);
        const chassisQuat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

        // Directions
        const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(chassisQuat);
        const forwardDir = new THREE.Vector3(1, 0, 0).applyQuaternion(chassisQuat);
        const rightDir = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQuat);

        // Velocity (Linear & Angular)
        const linVel = chassis.linvel();
        const angVel = chassis.angvel();
        const chassisVel = new THREE.Vector3(linVel.x, linVel.y, linVel.z);
        const chassisAngVel = new THREE.Vector3(angVel.x, angVel.y, angVel.z);

        let groundedWheels = 0;

        // 2. Raycast Loop for each wheel
        WHEEL_OFFSETS.forEach((offset, i) => {
            // Calculate Ray Origin
            const localOffset = new THREE.Vector3(offset.x, 0, offset.z);
            const wheelAttachPos = localOffset.clone().applyQuaternion(chassisQuat).add(chassisPos);

            // Raycast Down relative to chassis
            const rayDir = upDir.clone().negate();
            const rayOrigin = wheelAttachPos.clone().add(upDir.clone().multiplyScalar(0.5)); // Start slightly above

            const ray = new Ray(
                { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
                { x: rayDir.x, y: rayDir.y, z: rayDir.z }
            );

            // Cast Ray
            const hit = world.castRay(ray, CONFIG.rayLength, true, undefined, undefined, undefined, chassis);

            let suspensionDist = CONFIG.rayLength; // Default: Fully extended

            if (hit) {
                groundedWheels++;
                suspensionDist = hit.timeOfImpact;

                // --- PHYSICS FORCES ---

                // A. Suspension Force (Spring + Damper)
                // Velocity at wheel contact point = v_cm + (w x r)
                const r = wheelAttachPos.clone().sub(chassisPos);
                const velAtWheel = chassisVel.clone().add(chassisAngVel.clone().cross(r));

                const compression = Math.max(0, CONFIG.rayLength - suspensionDist);
                // V_up = Velocity projected onto Up vector
                const compressionSpeed = velAtWheel.dot(upDir);

                const springForce = (compression * CONFIG.stiffness) - (compressionSpeed * CONFIG.damping);

                // Apply Suspension Impulse
                const impulse = upDir.clone().multiplyScalar(springForce * delta);
                chassis.applyImpulseAtPoint({ x: impulse.x, y: impulse.y, z: impulse.z }, { x: wheelAttachPos.x, y: wheelAttachPos.y, z: wheelAttachPos.z }, true);

                // B. Side Friction (Prevent sliding)
                const sideSpeed = velAtWheel.dot(rightDir);
                const sideImpulse = rightDir.clone().multiplyScalar(-sideSpeed * CONFIG.sideFriction * delta);
                chassis.applyImpulseAtPoint({ x: sideImpulse.x, y: sideImpulse.y, z: sideImpulse.z }, { x: wheelAttachPos.x, y: wheelAttachPos.y, z: wheelAttachPos.z }, true);

                // C. Drive Force (Acceleration) - normal engine only
                let drive = 0;
                if (forward) drive = CONFIG.engineForce;
                if (backward) drive = -CONFIG.engineForce;

                if (drive !== 0) {
                    const driveImpulse = forwardDir.clone().multiplyScalar(drive * delta);
                    chassis.applyImpulseAtPoint({ x: driveImpulse.x, y: driveImpulse.y, z: driveImpulse.z }, { x: wheelAttachPos.x, y: wheelAttachPos.y, z: wheelAttachPos.z }, true);
                }
            }

            // --- VISUAL UPDATE ---
            const visualWheel = wheelVisuals[i].current;
            if (visualWheel) {
                // Determine visual position based on suspension compression
                // Local Y = -suspensionDist + wheelRadius
                // But ray starts at +0.5 relative to attach point
                // So visual relative position:
                // We want: if hit dist is `d`, wheel center is at `rayOrigin + rayDir * d`.
                // Convert back to local space.

                let wheelWorldPos;
                if (hit) {
                    wheelWorldPos = rayOrigin.clone().add(rayDir.clone().multiplyScalar(suspensionDist - CONFIG.wheelRadius));
                } else {
                    wheelWorldPos = rayOrigin.clone().add(rayDir.clone().multiplyScalar(CONFIG.rayLength - CONFIG.wheelRadius));
                }

                const localPos = wheelWorldPos.clone().sub(chassisPos).applyQuaternion(chassisQuat.clone().invert());
                visualWheel.position.copy(localPos);

                // Rotate wheels
                // Rotate wheels based on vehicle speed (not key press)
                const speed = linVel.x;
                visualWheel.rotation.z -= speed * delta * 0.5;
            }
        });

        // 3. Rotation Control (Air & Ground)
        if (left) chassis.applyTorqueImpulse({ x: 0, y: 0, z: CONFIG.airControlTorque * delta }, true); // Tilt Back
        if (right) chassis.applyTorqueImpulse({ x: 0, y: 0, z: -CONFIG.airControlTorque * delta }, true); // Tilt Fwd

        // 4. Turbo Rocket Boost (works in air too!)
        const currentFuel = useGameStore.getState().turboFuel;
        const isTurboOn = turbo && currentFuel > 0;

        if (isTurboOn) {
            // Apply rocket impulse directly to chassis center (forward direction)
            // Allow debugging via console: window.turboPower = 5000
            const rocketForce = (window as any).turboPower || 500;
            const rocketImpulse = forwardDir.clone().multiplyScalar(rocketForce * delta);
            chassis.applyImpulse({ x: rocketImpulse.x, y: rocketImpulse.y, z: 0 }, true);

            // Drain: 100% / 4 seconds = 25% per second
            setTurboFuel(currentFuel - (25 * delta));
            setTurboActive(true);
        } else {
            // Recharge: 100% / 12 seconds ≈ 8.33% per second
            // ONLY if at least one wheel is touching the ground
            if (currentFuel < 100 && groundedWheels > 0) {
                setTurboFuel(currentFuel + (8.33 * delta));
            }
            setTurboActive(false);
        }

        // 4. Camera Follow (LATE UPDATE)
        const targetPos = new THREE.Vector3(
            chassisPos.x + linVel.x * 0.05, // Slight lookahead on X
            chassisPos.y + 5 + (linVel.y * 0.05), // Lookahead on Y
            chassisPos.z + 20
        );

        // Stiffer Lerp (0.25) to reduce "Ghosting/Lag" at high speeds
        state.camera.position.lerp(targetPos, 0.25);
        state.camera.lookAt(chassisPos.x, chassisPos.y, 0);

        // Update Speed Store
        setSpeed(linVel.x);

        // 5. Reset if fell off
        if (chassisPos.y < -30) {
            // Reset to initial spawn position
            chassis.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
            chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
            chassis.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
            chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
    }); // End useFrame

    return (
        <group>
            <RigidBody
                ref={chassisRef}
                position={position}
                mass={CONFIG.chassisMass}
                colliders={false}
                enabledTranslations={[true, true, false]} // 2.5D: Lock Z
                enabledRotations={[false, false, true]}   // 2.5D: Lock X/Y rotation
                linearDamping={1.0}
                angularDamping={2.0}
            >
                {/* CHASSIS VISUALS */}
                <mesh castShadow>
                    <boxGeometry args={[CONFIG.length, 0.6, CONFIG.width]} />
                    <meshStandardMaterial color="#E67E22" side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[-CONFIG.length / 4, 0.6, 0]} castShadow>
                    <boxGeometry args={[CONFIG.length / 2.5, 0.8, CONFIG.width]} />
                    <meshStandardMaterial color="#D35400" side={THREE.DoubleSide} />
                </mesh>

                {/* COLLIDERS (Simple Box for Chassis) */}
                <CuboidCollider args={[CONFIG.length / 2, 0.3, CONFIG.width / 2]} />
                {/* Cabin Collider */}
                <CuboidCollider args={[CONFIG.length / 2.5 / 2, 0.4, CONFIG.width / 2]} position={[-CONFIG.length / 4, 0.6, 0]} />

                {/* WHEEL COLLIDERS (Prevent clipping when upside down) */}
                {WHEEL_OFFSETS.map((offset, i) => (
                    <CuboidCollider
                        key={`wheel-collider-${i}`}
                        position={[offset.x, 0.6, offset.z]}
                        args={[0.35, 0.35, 0.3]} // Small box at each wheel position
                    />
                ))}

                {/* VISUAL WHEELS (Children of RigidBody) */}
                {wheelVisuals.map((ref, i) => (
                    <group key={i} ref={ref}>
                        {/* Tire */}
                        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                            <cylinderGeometry args={[CONFIG.wheelRadius, CONFIG.wheelRadius, 0.6, 32]} />
                            <meshStandardMaterial color="#222" />
                        </mesh>
                        {/* Rim */}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.25, 0.25, 0.65, 16]} />
                            <meshStandardMaterial color="#666" />
                        </mesh>
                        {/* White Spokes (4 stripes) */}
                        {[0, 1, 2, 3].map((spoke) => (
                            <mesh
                                key={spoke}
                                rotation={[Math.PI / 2, 0, (spoke * Math.PI) / 2]}
                                position={[0, 0, 0]}
                            >
                                <boxGeometry args={[0.08, 0.62, CONFIG.wheelRadius * 1.8]} />
                                <meshStandardMaterial color="white" />
                            </mesh>
                        ))}
                    </group>
                ))}
            </RigidBody>
        </group>
    );
}
