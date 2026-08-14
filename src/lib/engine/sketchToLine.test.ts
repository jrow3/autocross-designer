import { describe, it, expect } from 'vitest';
import { sketchToWaypoints, stitchSketches } from './sketchToLine';
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

describe('stitchSketches', () => {
	// image-pixel strokes keep the geometry easy to reason about
	const seg = (x1: number, y1: number, x2: number, y2: number, n = 20): LngLat[] =>
		Array.from({ length: n }, (_, i) => [x1 + ((x2 - x1) * i) / (n - 1), y1 + ((y2 - y1) * i) / (n - 1)]);

	it('passes single strokes through untouched', () => {
		const stroke = seg(0, 0, 100, 0);
		expect(stitchSketches([stroke], 'image', 0.5)).toEqual(stroke);
		expect(stitchSketches([], 'image', 0.5)).toEqual([]);
	});

	it('chains strokes drawn in order', () => {
		const a = seg(0, 0, 100, 0);
		const b = seg(105, 0, 105, 100);
		const merged = stitchSketches([a, b], 'image', 0.5);
		expect(merged[0]).toEqual([0, 0]);
		expect(merged[merged.length - 1]).toEqual([105, 100]);
		expect(merged.length).toBe(40);
	});

	it('flips a stroke drawn backwards so ends meet', () => {
		const a = seg(0, 0, 100, 0);
		const bBackwards = seg(105, 100, 105, 0); // drawn far-end first
		const merged = stitchSketches([a, bBackwards], 'image', 0.5);
		// after a's end (100,0), the chain continues at b's NEAR end (105,0)
		expect(merged[20]).toEqual([105, 0]);
		expect(merged[merged.length - 1]).toEqual([105, 100]);
	});

	it('orders out-of-sequence strokes by proximity', () => {
		const first = seg(0, 0, 100, 0);
		const far = seg(210, 0, 300, 0); // drawn second, belongs third
		const middle = seg(105, 0, 205, 0);
		const merged = stitchSketches([first, far, middle], 'image', 0.5);
		expect(merged[merged.length - 1]).toEqual([300, 0]);
		// middle chunk sits between the two
		expect(merged[20]).toEqual([105, 0]);
		expect(merged[39]).toEqual([205, 0]);
	});

	it('flips the seed stroke when the course connects to its start', () => {
		const seedBackwards = seg(100, 0, 0, 0); // drawn right-to-left
		const next = seg(105, 0, 105, 100); // but the course continues from (100,0)
		const merged = stitchSketches([seedBackwards, next], 'image', 0.5);
		expect(merged[0]).toEqual([0, 0]);
		expect(merged[19]).toEqual([100, 0]);
		expect(merged[merged.length - 1]).toEqual([105, 100]);
	});

	it('stitches in map mode with real distances', () => {
		const ORIGIN: LngLat = [-96.769, 40.845];
		const mk = (bearing: number, from: LngLat, lenFt: number, n = 10): LngLat[] =>
			Array.from({ length: n }, (_, i) => feetToLngLatOffset(from, bearing, (lenFt * i) / (n - 1)));
		const a = mk(90, ORIGIN, 300);
		const b = mk(0, feetToLngLatOffset(ORIGIN, 90, 310), 300);
		const merged = stitchSketches([a, b], 'map');
		expect(merged.length).toBe(20);
		expect(merged[0]).toEqual(a[0]);
		expect(merged[merged.length - 1]).toEqual(b[b.length - 1]);
	});
});
