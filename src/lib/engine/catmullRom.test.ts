import { describe, expect, it } from 'vitest';
import { catmullRomSpline } from './catmullRom';
import type { LngLat } from '$lib/types/course';

describe('catmullRomSpline', () => {
	it('returns a copy for fewer than 2 points', () => {
		const single: LngLat[] = [[1, 2]];
		const result = catmullRomSpline(single);
		expect(result).toEqual(single);
		expect(result).not.toBe(single);
	});

	it('starts at the first point and ends at the last', () => {
		const points: LngLat[] = [
			[0, 0],
			[1, 2],
			[3, 1],
			[4, 4]
		];
		const result = catmullRomSpline(points);
		expect(result[0]).toEqual([0, 0]);
		expect(result[result.length - 1]).toEqual([4, 4]);
	});

	it('produces segmentsPerSpan points per span plus the final point', () => {
		const points: LngLat[] = [
			[0, 0],
			[1, 0],
			[2, 0]
		];
		const result = catmullRomSpline(points, 8);
		expect(result).toHaveLength(2 * 8 + 1);
	});

	it('interpolates collinear points along the line', () => {
		const points: LngLat[] = [
			[0, 0],
			[1, 0],
			[2, 0]
		];
		for (const [, y] of catmullRomSpline(points)) {
			expect(y).toBeCloseTo(0, 10);
		}
	});

	it('passes through every control point', () => {
		const points: LngLat[] = [
			[0, 0],
			[1, 3],
			[2, -1],
			[5, 2]
		];
		const segments = 4;
		const result = catmullRomSpline(points, segments);
		points.forEach((p, i) => {
			const at = result[Math.min(i * segments, result.length - 1)];
			expect(at[0]).toBeCloseTo(p[0], 10);
			expect(at[1]).toBeCloseTo(p[1], 10);
		});
	});
});
