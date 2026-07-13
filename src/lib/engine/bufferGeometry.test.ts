import { describe, expect, it } from 'vitest';
import { pointBuffer, lineBuffer } from './bufferGeometry';
import { haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const CENTER: LngLat = [-80.05, 40.44];

describe('pointBuffer', () => {
	it('produces 32 points by default', () => {
		expect(pointBuffer(CENTER, 20)).toHaveLength(32);
	});

	it('respects a custom segment count', () => {
		expect(pointBuffer(CENTER, 20, 8)).toHaveLength(8);
	});

	it('places every vertex ~bufferFeet from the center', () => {
		for (const vertex of pointBuffer(CENTER, 20)) {
			const dist = haversineFeet(CENTER, vertex);
			expect(Math.abs(dist - 20) / 20).toBeLessThan(0.02);
		}
	});
});

describe('lineBuffer', () => {
	const p1: LngLat = [-80.05, 40.44];
	const p2: LngLat = [-80.048, 40.44];

	it('falls back to pointBuffer for a single point', () => {
		expect(lineBuffer([p1], 10)).toHaveLength(16);
	});

	it('emits 2n side points plus two (segments+1) end caps', () => {
		expect(lineBuffer([p1, p2], 10, 16)).toHaveLength(2 * 2 + 2 * 17);
		const threePoints: LngLat[] = [p1, [-80.049, 40.441], p2];
		expect(lineBuffer(threePoints, 10, 16)).toHaveLength(2 * 3 + 2 * 17);
	});

	it('offsets side vertices ~bufferFeet from the line for a straight segment', () => {
		const result = lineBuffer([p1, p2], 10, 16);
		const leftStart = result[0];
		const leftEnd = result[1];
		expect(Math.abs(haversineFeet(p1, leftStart) - 10) / 10).toBeLessThan(0.02);
		expect(Math.abs(haversineFeet(p2, leftEnd) - 10) / 10).toBeLessThan(0.02);
	});

	it('is symmetric about a horizontal line', () => {
		const segments = 16;
		const result = lineBuffer([p1, p2], 10, segments);
		// layout: left(2), endCap(17), reversed right(2), startCap(17)
		const rightStart = result[2 + segments + 1 + 1];
		expect(rightStart[0]).toBeCloseTo(p1[0], 12);
		expect(rightStart[1] - p1[1]).toBeCloseTo(-(result[0][1] - p1[1]), 12);
	});
});
