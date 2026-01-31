import * as THREE from 'three';

/**
 * Normalizes an array of numbers to a specific range [min, max]
 */
export function normalizeData(data: number[], minHeight: number = 0, maxHeight: number = 20): number[] {
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal;

    if (range === 0) return data.map(() => minHeight);

    return data.map(val => {
        const normalized = (val - minVal) / range; // 0 to 1
        return minHeight + (normalized * (maxHeight - minHeight));
    });
}

/**
 * Creates a CatmullRomCurve3 from an array of Y values
 * xStep: Distance between points on X axis
 */
export function createRoadCurve(data: number[], xStep: number = 2): THREE.CatmullRomCurve3 {
    const points = data.map((y, index) => {
        return new THREE.Vector3(index * xStep, y, 0);
    });
    return new THREE.CatmullRomCurve3(points);
}
