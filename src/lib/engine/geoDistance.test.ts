import { describe, it, expect } from 'vitest';
import { pointToSegmentFeet, pointToPolylineFeet } from './geoDistance';
import { feetToLngLatOffset } from './geo';
import type { LngLat } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];

describe('pointToSegmentFeet map mode', () => {
	it('measures perpendicular distance to a segment', () => {
		const a = ORIGIN;
		const b = feetToLngLatOffset(ORIGIN, 90, 200); // east
		const p = feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 90, 100), 0, 30); // 30 ft north of midpoint
		expect(pointToSegmentFeet(p, a, b, 'map')!).toBeCloseTo(30, 0);
	});

	it('clamps to segment endpoints', () => {
		const a = ORIGIN;
		const b = feetToLngLatOffset(ORIGIN, 90, 100);
		const p = feetToLngLatOffset(ORIGIN, 270, 50); // 50 ft west of a
		expect(pointToSegmentFeet(p, a, b, 'map')!).toBeCloseTo(50, 0);
	});

	it('handles degenerate zero-length segments', () => {
		const p = feetToLngLatOffset(ORIGIN, 0, 40);
		expect(pointToSegmentFeet(p, ORIGIN, ORIGIN, 'map')!).toBeCloseTo(40, 0);
	});
});

describe('pointToSegmentFeet image mode', () => {
	it('scales pixel distance by feetPerPixel', () => {
		// segment along y=100 from x=0..400, point at (200, 220): 120 px * 0.5 = 60 ft
		expect(pointToSegmentFeet([200, 220], [0, 100], [400, 100], 'image', 0.5)!).toBeCloseTo(60);
	});

	it('returns null without a scale', () => {
		expect(pointToSegmentFeet([0, 0], [1, 1], [2, 2], 'image')).toBeNull();
	});
});

describe('pointToPolylineFeet', () => {
	it('takes the minimum across segments', () => {
		const line: LngLat[] = [
			ORIGIN,
			feetToLngLatOffset(ORIGIN, 90, 200),
			feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 90, 200), 0, 200)
		];
		// 25 ft east of the second segment
		const p = feetToLngLatOffset(feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 90, 200), 0, 100), 90, 25);
		expect(pointToPolylineFeet(p, line, 'map')!).toBeCloseTo(25, 0);
	});

	it('handles single-point polylines', () => {
		const p = feetToLngLatOffset(ORIGIN, 90, 75);
		expect(pointToPolylineFeet(p, [ORIGIN], 'map')!).toBeCloseTo(75, 0);
	});

	it('returns null for empty polylines', () => {
		expect(pointToPolylineFeet(ORIGIN, [], 'map')).toBeNull();
	});
});
