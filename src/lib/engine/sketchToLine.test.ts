import { describe, it, expect } from 'vitest';
import { sketchToWaypoints } from './sketchToLine';
import { feetToLngLatOffset, haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];

function denseStroke(lengthFt: number, points = 200): LngLat[] {
	// a wiggly eastward stroke like a freehand sketch
	const stroke: LngLat[] = [];
	for (let i = 0; i < points; i++) {
		const along = (i / (points - 1)) * lengthFt;
		const wobble = Math.sin(i / 9) * 15;
		stroke.push(feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 90, along), 0, wobble));
	}
	return stroke;
}

describe('sketchToWaypoints', () => {
	it('returns null for degenerate strokes', () => {
		expect(sketchToWaypoints([], 'map')).toBeNull();
		expect(sketchToWaypoints([ORIGIN], 'map')).toBeNull();
	});

	it('resamples a dense stroke to ~50 ft spacing in map mode', () => {
		const waypoints = sketchToWaypoints(denseStroke(1000), 'map')!;
		expect(waypoints.length).toBeGreaterThan(15);
		expect(waypoints.length).toBeLessThan(30);
		for (let i = 2; i < waypoints.length - 1; i++) {
			const gap = haversineFeet(waypoints[i - 1].lngLat, waypoints[i].lngLat);
			expect(gap).toBeGreaterThan(30);
			expect(gap).toBeLessThan(75);
		}
	});

	it('ends exactly on the stroke end', () => {
		const stroke = denseStroke(800);
		const waypoints = sketchToWaypoints(stroke, 'map')!;
		expect(waypoints[waypoints.length - 1].lngLat).toEqual(stroke[stroke.length - 1]);
	});

	it('caps waypoint count on very long strokes', () => {
		const waypoints = sketchToWaypoints(denseStroke(9000, 800), 'map')!;
		expect(waypoints.length).toBeLessThanOrEqual(62);
	});

	it('falls back to index thinning without a calibrated image scale', () => {
		const stroke: LngLat[] = Array.from({ length: 120 }, (_, i) => [100 + i * 5, 400 + Math.sin(i / 7) * 40]);
		const waypoints = sketchToWaypoints(stroke, 'image')!;
		expect(waypoints.length).toBeGreaterThan(10);
		expect(waypoints.length).toBeLessThan(20);
	});

	it('resamples by feet with a calibrated image scale', () => {
		// 1000 px stroke at 0.5 ft/px = 500 ft → ~10 waypoints at 50 ft
		const stroke: LngLat[] = Array.from({ length: 200 }, (_, i) => [100 + i * 5, 400]);
		const waypoints = sketchToWaypoints(stroke, 'image', 0.5)!;
		expect(waypoints.length).toBeGreaterThanOrEqual(10);
		expect(waypoints.length).toBeLessThanOrEqual(13);
	});
});
