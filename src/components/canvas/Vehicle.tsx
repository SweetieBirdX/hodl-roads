"use client";

import { useRef, useState, useEffect, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, useRevoluteJoint, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

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
        const tiltStrength = 20;
        if (controls.leftTilt) {
            chassis.current.wakeUp();
            chassis.current.applyTorqueImpulse({ x: 0, y: 0, z: tiltStrength * 0.1 }, true); // Tilt Back
        }
        if (controls.rightTilt) {
            chassis.current.wakeUp();
            chassis.current.applyTorqueImpulse({ x: 0, y: 0, z: -tiltStrength * 0.1 }, true); // Tilt Fwd
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
                position={[-10, 5, 0]}
                mass={5}
                colliders={false}
                enabledTranslations={[true, true, false]} // Allow X/Y but LOCK Z
                enabledRotations={[false, false, true]}   // Lock X/Y (Roll/Steer), Allow Z (Pitch)
            >
                <CuboidCollider args={[1.5, 0.5, 0.75]} />
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[3, 1, 1.5]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
                {/* Cabin Visual */}
                <mesh position={[-0.5, 0.75, 0]}>
                    <boxGeometry args={[1.5, 0.5, 1.4]} />
                    <meshStandardMaterial color="#cc6600" />
                </mesh>
            </RigidBody>

            {/* WHEELS */}
            <WheelController chassis={chassis} controls={controls} position={[-1.2, 3.5, 0.8]} />
            <WheelController chassis={chassis} controls={controls} position={[1.2, 3.5, 0.8]} />
            <WheelController chassis={chassis} controls={controls} position={[-1.2, 3.5, -0.8]} />
            <WheelController chassis={chassis} controls={controls} position={[1.2, 3.5, -0.8]} />
        </group>
    );
}

// Sub-component to manage wheel physics and joints
function WheelController({ chassis, controls, position }: {
    chassis: RefObject<RapierRigidBody | null>,
    controls: any,
    position: [number, number, number]
}) {
    const wheel = useRef<RapierRigidBody>(null);
    const [x, y, z] = position;

    // Cast chassis ref to expected type to satisfy TS
    useRevoluteJoint(chassis as any, wheel, [
        [x, -0.5, z], // Anchor on Chassis (Local)
        [0, 0, 0],    // Anchor on Wheel (Center)
        [0, 0, 1]     // Axis Z
    ]);

    useFrame(() => {
        if (!wheel.current) return;
        const torque = 15 * 0.01; // Power
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
            position={[-10, 5 - 0.5, 0]} // Initial spawn, joint will snap it.
            colliders={false}
            friction={2}
            restitution={0}
        >
            <CylinderCollider args={[0.4, 0.25]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.25, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </RigidBody>
    );
}
