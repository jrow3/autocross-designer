import { describe, expect, it } from 'vitest';
import { computeSlalomPositions } from './slalomLogic';
import { haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const START: LngLat = [-80.05, 40.44];
const EAST_END: LngLat = [-80.048, 40.44];
const DIAG_END: LngLat = [-80.048, 40.442];

describe('computeSlalomPositions', () => {
	it('returns just the start for count < 2', () => {
		expect(computeSlalomPositions(START, EAST_END, { count: 1 }, 'map')).toEqual([START]);
		expect(computeSlalomPositions(START, EAST_END, { count: 0 }, 'map')).toEqual([START]);
	});

	it('spacing mode: adjacent cones are spacingFeet apart', () => {
		const positions = computeSlalomPositions(
			START, EAST_END, { count: 5, spacingFeet: 50 }, 'map'
		);
		expect(positions).toHaveLength(5);
		for (let i = 1; i < positions.length; i++) {
			const gap = haversineFeet(positions[i - 1], positions[i]);
			expect(Math.abs(gap - 50) / 50).toBeLessThan(0.01);
		}
	});

	it('totalLength mode: divides the length evenly across count cones', () => {
		const positions = computeSlalomPositions(
			START, EAST_END, { count: 5, totalLengthFeet: 200 }, 'map'
		);
		expect(positions).toHaveLength(5);
		const total = haversineFeet(positions[0], positions[4]);
		expect(Math.abs(total - 200) / 200).toBeLessThan(0.01);
		const gap = haversineFeet(positions[0], positions[1]);
		expect(Math.abs(gap - 50) / 50).toBeLessThan(0.01);
	});

	it('fallback mode: spreads cones evenly from start to end', () => {
		const positions = computeSlalomPositions(START, EAST_END, { count: 4 }, 'map');
		expect(positions).toHaveLength(4);
		expect(positions[0]).toEqual(START);
		expect(positions[3][0]).toBeCloseTo(EAST_END[0], 10);
		expect(positions[3][1]).toBeCloseTo(EAST_END[1], 10);
		const first = haversineFeet(positions[0], positions[1]);
		const second = haversineFeet(positions[1], positions[2]);
		expect(first).toBeCloseTo(second, 6);
	});

	it('all cones are collinear between start and end', () => {
		const positions = computeSlalomPositions(
			START, DIAG_END, { count: 6, spacingFeet: 30 }, 'map'
		);
		const dirLng = DIAG_END[0] - START[0];
		const dirLat = DIAG_END[1] - START[1];
		for (const p of positions) {
			const cross = (p[0] - START[0]) * dirLat - (p[1] - START[1]) * dirLng;
			expect(Math.abs(cross)).toBeLessThan(1e-12);
		}
	});

	it('image mode spacing uses feetPerPixel', () => {
		const positions = computeSlalomPositions(
			[0, 0], [100, 0], { count: 3, spacingFeet: 10 }, 'image', 0.5
		);
		expect(positions).toEqual([
			[0, 0],
			[20, 0],
			[40, 0]
		]);
	});

	it('image mode without feetPerPixel falls back to even division', () => {
		const positions = computeSlalomPositions(
			[0, 0], [90, 0], { count: 4, spacingFeet: 10 }, 'image'
		);
		expect(positions).toEqual([
			[0, 0],
			[30, 0],
			[60, 0],
			[90, 0]
		]);
	});
});
