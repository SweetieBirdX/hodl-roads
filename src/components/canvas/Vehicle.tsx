"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, useRapier, CuboidCollider } from "@react-three/rapier";
import { Ray } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";

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
    brakingForce: 50,      // Reduced braking too
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

export default function Vehicle() {
    const chassisRef = useRef<RapierRigidBody>(null);
    const { world } = useRapier();
    const [, get] = useKeyboardControls();

    // Visual Wheel Refs
    const flWheel = useRef<THREE.Group>(null);
    const frWheel = useRef<THREE.Group>(null);
    const rlWheel = useRef<THREE.Group>(null);
    const rrWheel = useRef<THREE.Group>(null);
    const wheelVisuals = [flWheel, frWheel, rlWheel, rrWheel];

    useFrame((state, delta) => {
        if (!chassisRef.current) return;
        const chassis = chassisRef.current;
        const { forward, backward, left, right } = get();

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

                // C. Drive Force (Acceleration)
                let drive = 0;
                if (forward) drive = CONFIG.engineForce;
                if (backward) drive = -CONFIG.engineForce; // Simple reverse

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
                if (forward || backward) {
                    const speed = linVel.x; // Approximate rotation speed from forward velocity
                    visualWheel.rotation.z -= speed * delta * 0.5;
                }
            }
        });

        // 3. Rotation Control (Air & Ground)
        if (left) chassis.applyTorqueImpulse({ x: 0, y: 0, z: CONFIG.airControlTorque * delta }, true); // Tilt Back
        if (right) chassis.applyTorqueImpulse({ x: 0, y: 0, z: -CONFIG.airControlTorque * delta }, true); // Tilt Fwd

        // 4. Camera Follow
        const cameraOffset = new THREE.Vector3(0, 6, 25);
        const targetPos = new THREE.Vector3(chassisPos.x, chassisPos.y + 6, chassisPos.z + 25);
        // Smooth lerp
        state.camera.position.lerp(targetPos, 0.1);
        state.camera.lookAt(chassisPos.x, chassisPos.y, 0);

        // 5. Reset if fell off
        if (chassisPos.y < -20) {
            chassis.setTranslation({ x: 0, y: 5, z: 0 }, true);
            chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
            chassis.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
        }
    });

    return (
        <group>
            <RigidBody
                ref={chassisRef}
                position={[-10, 5, 0]}
                mass={CONFIG.chassisMass}
                colliders={false}
                enabledTranslations={[true, true, false]} // 2.5D: Lock Z
                enabledRotations={[false, false, true]}   // 2.5D: Lock X/Y rotation
                linearDamping={1.0}
                angularDamping={2.0}
            >
                {/* CHASSIS VISUALS */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[CONFIG.length, 0.6, CONFIG.width]} />
                    <meshStandardMaterial color="#E67E22" />
                </mesh>
                <mesh position={[-CONFIG.length / 4, 0.6, 0]} castShadow>
                    <boxGeometry args={[CONFIG.length / 2.5, 0.8, CONFIG.width]} />
                    <meshStandardMaterial color="#D35400" />
                </mesh>

                {/* COLLIDERS (Simple Box for Chassis) */}
                <CuboidCollider args={[CONFIG.length / 2, 0.3, CONFIG.width / 2]} />
                {/* Cabin Collider */}
                <CuboidCollider args={[CONFIG.length / 2.5 / 2, 0.4, CONFIG.width / 2]} position={[-CONFIG.length / 4, 0.6, 0]} />

                {/* VISUAL WHEELS (Children of RigidBody) */}
                {wheelVisuals.map((ref, i) => (
                    <group key={i} ref={ref}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                            <cylinderGeometry args={[CONFIG.wheelRadius, CONFIG.wheelRadius, 0.6, 32]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                        {/* Rim */}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.3, 0.3, 0.65, 16]} />
                            <meshStandardMaterial color="#888" />
                        </mesh>
                    </group>
                ))}
            </RigidBody>
        </group>
    );
}
