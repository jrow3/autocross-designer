import { describe, it, expect } from 'vitest';
import { samplePath, classifySegments } from './pathAnalysis';
import { makeFrame } from './planarFrame';
import { feetToLngLatOffset } from './geo';
import type { LngLat } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];
const mapFrame = () => makeFrame(ORIGIN, 'map')!;

function circleWaypoints(radiusFt: number, points = 24): LngLat[] {
	const pts: LngLat[] = [];
	for (let i = 0; i <= points; i++) {
		const angle = (i / points) * 360;
		const center = feetToLngLatOffset(ORIGIN, 90, radiusFt); // center east of origin
		pts.push(feetToLngLatOffset(center, angle, radiusFt));
	}
	return pts;
}

describe('samplePath', () => {
	it('returns null for degenerate input', () => {
		expect(samplePath([], mapFrame())).toBeNull();
		expect(samplePath([ORIGIN], mapFrame())).toBeNull();
	});

	it('spaces samples uniformly by arc length', () => {
		const line = [ORIGIN, feetToLngLatOffset(ORIGIN, 90, 300)];
		const path = samplePath(line, mapFrame(), { spacingFt: 3 })!;
		for (let i = 1; i < path.s.length - 1; i++) {
			expect(path.s[i] - path.s[i - 1]).toBeCloseTo(3, 5);
		}
		expect(path.lengthFt).toBeGreaterThan(295);
		expect(path.lengthFt).toBeLessThan(305);
	});

	it('estimates a 100 ft circle radius within 5%', () => {
		const path = samplePath(circleWaypoints(100), mapFrame())!;
		// interior samples away from the ends
		const mid = path.radiusFt.slice(20, path.radiusFt.length - 20).filter(Number.isFinite);
		const avg = mid.reduce((a, b) => a + b, 0) / mid.length;
		expect(Math.abs(avg - 100) / 100).toBeLessThan(0.05);
	});

	it('reports straight lines as infinite radius', () => {
		const line = [ORIGIN, feetToLngLatOffset(ORIGIN, 0, 500)];
		const path = samplePath(line, mapFrame())!;
		const interior = path.radiusFt.slice(5, -5);
		expect(interior.every((r) => r > 5000)).toBe(true);
	});

	it('caps the sample count on very long paths', () => {
		const line = [ORIGIN, feetToLngLatOffset(ORIGIN, 90, 30000)];
		const path = samplePath(line, mapFrame(), { spacingFt: 1 })!;
		expect(path.pts.length).toBeLessThanOrEqual(5002);
	});

	it('flags turn direction with map handedness (counterclockwise = +1)', () => {
		// left turn: north then curving west
		const wps = [
			ORIGIN,
			feetToLngLatOffset(ORIGIN, 0, 200),
			feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 0, 350), 315, 120)
		];
		const path = samplePath(wps, mapFrame())!;
		const signs = path.turnSign.filter((v) => v !== 0);
		const sum = signs.reduce((a, b) => a + b, 0);
		expect(sum).toBeGreaterThan(0);
	});
});

describe('classifySegments', () => {
	it('classifies straight-corner-straight in an L-shaped path', () => {
		// two extra waypoints near the corner pull the spline into a tight bend
		const approach = feetToLngLatOffset(ORIGIN, 0, 500);
		const corner = feetToLngLatOffset(ORIGIN, 0, 560);
		const exit = feetToLngLatOffset(corner, 90, 60);
		const end = feetToLngLatOffset(corner, 90, 560);
		const path = samplePath([ORIGIN, approach, corner, exit, end], mapFrame())!;
		const segments = classifySegments(path);
		const kinds = segments.map((seg) => seg.kind);
		expect(kinds[0]).toBe('straight');
		expect(kinds).toContain('corner');
		expect(kinds[kinds.length - 1]).toBe('straight');
	});

	it('classifies a tight circle as corner', () => {
		const path = samplePath(circleWaypoints(80), mapFrame())!;
		const segments = classifySegments(path);
		const cornerLength = segments
			.filter((seg) => seg.kind === 'corner')
			.reduce((a, seg) => a + seg.lengthFt, 0);
		expect(cornerLength / path.lengthFt).toBeGreaterThan(0.8);
	});

	it('accumulates arc degrees around a full circle', () => {
		const path = samplePath(circleWaypoints(80), mapFrame())!;
		const segments = classifySegments(path);
		const totalArc = segments.reduce((a, seg) => a + seg.arcDeg, 0);
		expect(totalArc).toBeGreaterThan(300);
	});
});
