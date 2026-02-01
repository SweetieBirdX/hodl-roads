"use client";

import { useRef, useState, useEffect, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, useRevoluteJoint, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

// --- VEHICLE CONFIGURATION ---
const CHASSIS_HALF_WIDTH = 0.75;  // Half Z-size of chassis collider
const WHEEL_THICKNESS = 0.3;     // Wheel "height" (Z-direction when rotated)
const WHEEL_RADIUS = 0.4;
const WHEEL_Z_OFFSET = CHASSIS_HALF_WIDTH + WHEEL_THICKNESS / 2 + 0.1; // Ensure no overlap

export default function Vehicle() {
    const chassis = useRef<RapierRigidBody>(null);

    // Controls State
    const [controls, setControls] = useState({ forward: false, backward: false, leftTilt: false, rightTilt: false });

    // Store update
    const setSpeed = useGameStore((state) => state.setSpeed);

    // Input Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": case "arrowup": setControls(c => ({ ...c, forward: true })); break;
                case "s": case "arrowdown": setControls(c => ({ ...c, backward: true })); break;
                case "a": case "arrowleft": setControls(c => ({ ...c, leftTilt: true })); break;
                case "d": case "arrowright": setControls(c => ({ ...c, rightTilt: true })); break;
                case "r": handleRescue(); break; // Rescue mechanic
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": case "arrowup": setControls(c => ({ ...c, forward: false })); break;
                case "s": case "arrowdown": setControls(c => ({ ...c, backward: false })); break;
                case "a": case "arrowleft": setControls(c => ({ ...c, leftTilt: false })); break;
                case "d": case "arrowright": setControls(c => ({ ...c, rightTilt: false })); break;
            }
        };

        // Rescue: Reset velocity, rotation, and lift up
        const handleRescue = () => {
            if (!chassis.current) return;
            const pos = chassis.current.translation();
            // 1. Kill all velocity
            chassis.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            chassis.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
            // 2. Reset rotation to upright (quaternion identity)
            chassis.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
            // 3. Lift up
            chassis.current.setTranslation({ x: pos.x, y: pos.y + 3, z: 0 }, true);
            // 4. Wake up
            chassis.current.wakeUp();
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useFrame((state) => {
        if (!chassis.current) return;

        // 1. Air Control (Tilt)
        const tiltStrength = 30;
        if (controls.leftTilt) {
            chassis.current.wakeUp();
            chassis.current.applyTorqueImpulse({ x: 0, y: 0, z: tiltStrength * 0.05 }, true); // Tilt Back
        }
        if (controls.rightTilt) {
            chassis.current.wakeUp();
            chassis.current.applyTorqueImpulse({ x: 0, y: 0, z: -tiltStrength * 0.05 }, true); // Tilt Fwd
        }

        // 2. Camera Follow
        const chassisPos = chassis.current.translation();
        const cameraOffset = new THREE.Vector3(0, 5, 20); // Side view

        // Smooth Camera
        const targetPos = new THREE.Vector3(
            chassisPos.x + cameraOffset.x,
            chassisPos.y + cameraOffset.y,
            chassisPos.z + cameraOffset.z
        );
        state.camera.position.lerp(targetPos, 0.1);
        state.camera.lookAt(chassisPos.x, chassisPos.y, 0);

        // Update Speed Store
        setSpeed(chassis.current.linvel().x);
    });

    return (
        <group>
            {/* CHASSIS */}
            <RigidBody
                ref={chassis}
                position={[-10, 3, 0]}
                mass={15}
                colliders={false}
                restitution={0}
                linearDamping={1.5}
                angularDamping={1.5}
                enabledTranslations={[true, true, false]} // Allow X/Y but LOCK Z
                enabledRotations={[false, false, true]}   // Lock X/Y (Roll/Steer), Allow Z (Pitch)
            >
                <CuboidCollider args={[1.5, 0.5, CHASSIS_HALF_WIDTH]} restitution={0} />
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[3, 1, CHASSIS_HALF_WIDTH * 2]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
                {/* Cabin Visual */}
                <mesh position={[-0.5, 0.75, 0]}>
                    <boxGeometry args={[1.5, 0.5, CHASSIS_HALF_WIDTH * 2 - 0.1]} />
                    <meshStandardMaterial color="#cc6600" />
                </mesh>
            </RigidBody>

            {/* WHEELS - Positioned OUTSIDE the chassis on Z-axis */}
            {/* Front-Right */}
            <WheelController chassis={chassis} controls={controls} anchorX={1.2} anchorZ={WHEEL_Z_OFFSET} />
            {/* Front-Left */}
            <WheelController chassis={chassis} controls={controls} anchorX={1.2} anchorZ={-WHEEL_Z_OFFSET} />
            {/* Rear-Right */}
            <WheelController chassis={chassis} controls={controls} anchorX={-1.2} anchorZ={WHEEL_Z_OFFSET} />
            {/* Rear-Left */}
            <WheelController chassis={chassis} controls={controls} anchorX={-1.2} anchorZ={-WHEEL_Z_OFFSET} />
        </group>
    );
}

// Sub-component to manage wheel physics and joints
function WheelController({ chassis, controls, anchorX, anchorZ }: {
    chassis: RefObject<RapierRigidBody | null>,
    controls: any,
    anchorX: number,
    anchorZ: number
}) {
    const wheel = useRef<RapierRigidBody>(null);

    // Joint: Connect wheel to chassis
    // Anchor on chassis is relative to chassis center
    useRevoluteJoint(chassis as any, wheel, [
        [anchorX, -0.5, anchorZ], // Anchor on Chassis (Local to chassis center)
        [0, 0, 0],                // Anchor on Wheel (Center)
        [0, 0, 1]                 // Axis Z (wheel rotates around Z-axis)
    ]);

    useFrame(() => {
        if (!wheel.current) return;
        const torque = 0.25; // Reduced power (50% nerf)
        if (controls.forward) {
            wheel.current.wakeUp();
            wheel.current.applyTorqueImpulse({ x: 0, y: 0, z: -torque }, true);
        }
        if (controls.backward) {
            wheel.current.wakeUp();
            wheel.current.applyTorqueImpulse({ x: 0, y: 0, z: torque }, true);
        }
    });

    return (
        <RigidBody
            ref={wheel}
            position={[-10 + anchorX, 3 - 0.5, anchorZ]} // Initial spawn near expected joint position
            colliders={false}
            mass={1}
            friction={2}
            restitution={0}
            linearDamping={0.5}
            angularDamping={0.5}
        >
            <CylinderCollider args={[WHEEL_THICKNESS / 2, WHEEL_RADIUS]} rotation={[Math.PI / 2, 0, 0]} restitution={0} />
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_THICKNESS, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </RigidBody>
    );
}
