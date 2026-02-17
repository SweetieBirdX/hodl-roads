"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Map button names to keyboard codes that drei's KeyboardControls expects
const KEY_MAP: Record<string, string> = {
    forward: "KeyW",
    backward: "KeyS",
    left: "KeyA",
    right: "KeyD",
    reset: "KeyR",
    turbo: "ShiftLeft",
};

// Dispatch real KeyboardEvents so drei's KeyboardControls picks them up
function simulateKey(code: string, type: "keydown" | "keyup") {
    window.dispatchEvent(
        new KeyboardEvent(type, {
            code,
            key: code,
            bubbles: true,
            cancelable: true,
        })
    );
}

// Reusable touch button — uses native addEventListener with { passive: false }
// to avoid "Unable to preventDefault inside passive event listener" warnings
function TouchButton({
    action,
    label,
    className = "",
}: {
    action: string;
    label: React.ReactNode;
    className?: string;
}) {
    const [pressed, setPressed] = useState(false);
    const code = KEY_MAP[action];
    const btnRef = useRef<HTMLButtonElement>(null);
    const pressedRef = useRef(false);

    useEffect(() => {
        const el = btnRef.current;
        if (!el) return;

        const handleStart = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!pressedRef.current) {
                pressedRef.current = true;
                setPressed(true);
                simulateKey(code, "keydown");
            }
        };

        const handleEnd = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (pressedRef.current) {
                pressedRef.current = false;
                setPressed(false);
                simulateKey(code, "keyup");
            }
        };

        // Register with { passive: false } so preventDefault works
        el.addEventListener("touchstart", handleStart, { passive: false });
        el.addEventListener("touchend", handleEnd, { passive: false });
        el.addEventListener("touchcancel", handleEnd, { passive: false });

        return () => {
            el.removeEventListener("touchstart", handleStart);
            el.removeEventListener("touchend", handleEnd);
            el.removeEventListener("touchcancel", handleEnd);
            // Safety: release key if unmounting while pressed
            if (pressedRef.current) {
                simulateKey(code, "keyup");
            }
        };
    }, [code]);

    // Mouse fallback for desktop testing
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            if (!pressedRef.current) {
                pressedRef.current = true;
                setPressed(true);
                simulateKey(code, "keydown");
            }
        },
        [code]
    );

    const handleMouseUp = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            if (pressedRef.current) {
                pressedRef.current = false;
                setPressed(false);
                simulateKey(code, "keyup");
            }
        },
        [code]
    );

    return (
        <button
            ref={btnRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`touch-btn ${pressed ? "touch-btn-active" : ""} ${className}`}
            style={{
                touchAction: "none",
                WebkitTouchCallout: "none",
                userSelect: "none",
            }}
        >
            {label}
        </button>
    );
}

// Reset button for top bar (next to Pause)
export function TouchResetButton() {
    return (
        <div className="touch-only">
            <TouchButton
                action="reset"
                label="⟳"
                className="touch-btn-reset-top"
            />
        </div>
    );
}

export default function TouchControls() {
    // Prevent context menu on long-press
    useEffect(() => {
        const prevent = (e: Event) => e.preventDefault();
        document.addEventListener("contextmenu", prevent);
        return () => document.removeEventListener("contextmenu", prevent);
    }, []);

    return (
        <div className="touch-controls-container">
            {/* Single bottom bar: TiltL | TiltR | spacer | Brake | Gas | Turbo */}
            <div className="touch-bar">
                {/* Left group: Tilts */}
                <div className="touch-group">
                    <TouchButton action="left" label={<span style={{ display: 'inline-block', transform: 'rotate(-90deg)' }}>↺</span>} className="touch-btn-tilt" />
                    <TouchButton action="right" label={<span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>↻</span>} className="touch-btn-tilt" />
                </div>

                {/* Spacer */}
                <div className="touch-spacer" />

                {/* Right group: Brake, Gas, Turbo */}
                <div className="touch-group">
                    <TouchButton action="backward" label="▼" className="touch-btn-brake" />
                    <TouchButton action="forward" label="▲" className="touch-btn-gas" />
                    <TouchButton action="turbo" label="🔥" className="touch-btn-turbo" />
                </div>
            </div>
        </div>
    );
}
