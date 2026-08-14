import type { LngLat } from '$lib/types/course';
import type { PlanarFrame } from './planarFrame';

// Reflect a point across the (infinite) line through the axis endpoints,
// working in the planar feet frame so the reflection is congruent in both modes.
export function reflectAcrossAxis(p: LngLat, axis: [LngLat, LngLat], frame: PlanarFrame): LngLat {
	const [ax, ay] = frame.toFeet(axis[0]);
	const [bx, by] = frame.toFeet(axis[1]);
	const [px, py] = frame.toFeet(p);
	const dx = bx - ax;
	const dy = by - ay;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) return p;
	const t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
	const footX = ax + t * dx;
	const footY = ay + t * dy;
	return frame.fromFeet([2 * footX - px, 2 * footY - py]);
}

// Perpendicular distance in feet from a point to the infinite axis line.
export function distanceToAxisFeet(p: LngLat, axis: [LngLat, LngLat], frame: PlanarFrame): number {
	const [ax, ay] = frame.toFeet(axis[0]);
	const [bx, by] = frame.toFeet(axis[1]);
	const [px, py] = frame.toFeet(p);
	const dx = bx - ax;
	const dy = by - ay;
	const len = Math.hypot(dx, dy);
	if (len === 0) return Math.hypot(px - ax, py - ay);
	return Math.abs((px - ax) * dy - (py - ay) * dx) / len;
}
