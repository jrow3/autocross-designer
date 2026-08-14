import type { LngLat } from '$lib/types/course';
import { distanceFeet } from './geo';
import { makeFrame } from './planarFrame';

// Mode-aware point-to-segment / point-to-polyline distances in feet.
// Rules use these instead of bufferGeometry (degree-space, map-only).

export function pointToSegmentFeet(
	p: LngLat,
	a: LngLat,
	b: LngLat,
	mode: 'map' | 'image',
	feetPerPixel?: number
): number | null {
	const frame = makeFrame(a, mode, feetPerPixel);
	if (!frame) return null;
	const [px, py] = frame.toFeet(p);
	const [ax, ay] = frame.toFeet(a);
	const [bx, by] = frame.toFeet(b);
	const dx = bx - ax;
	const dy = by - ay;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) return distanceFeet(p, a, mode, feetPerPixel);
	const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
	return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function pointToPolylineFeet(
	p: LngLat,
	polyline: LngLat[],
	mode: 'map' | 'image',
	feetPerPixel?: number
): number | null {
	if (polyline.length === 0) return null;
	if (polyline.length === 1) return distanceFeet(p, polyline[0], mode, feetPerPixel);
	let min = Infinity;
	for (let i = 1; i < polyline.length; i++) {
		const d = pointToSegmentFeet(p, polyline[i - 1], polyline[i], mode, feetPerPixel);
		if (d == null) return null;
		if (d < min) min = d;
	}
	return min;
}
