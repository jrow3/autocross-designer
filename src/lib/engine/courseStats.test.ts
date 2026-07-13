import { describe, expect, it } from 'vitest';
import { drivingLineLengthFeet } from './courseStats';
import { emptyCourse } from './courseSerializer';
import type { CourseData, LngLat } from '$lib/types/course';

function courseWithLine(points: LngLat[]): CourseData {
	return { ...emptyCourse(), drivingLine: points.map((lngLat) => ({ lngLat })) };
}

describe('drivingLineLengthFeet', () => {
	it('returns 0 for fewer than two waypoints', () => {
		expect(drivingLineLengthFeet(courseWithLine([]))).toBe(0);
		expect(drivingLineLengthFeet(courseWithLine([[-80.05, 40.44]]))).toBe(0);
	});

	it('sums segment lengths along the line', () => {
		// ~0.0001 deg latitude ≈ 36.5 ft per segment
		const total = drivingLineLengthFeet(
			courseWithLine([[-80.05, 40.44], [-80.05, 40.4401], [-80.05, 40.4402]])
		);
		expect(total).toBeGreaterThan(70);
		expect(total).toBeLessThan(76);
	});

	it('is additive: two segments equal the sum of each measured alone', () => {
		const a: LngLat = [-80.05, 40.44];
		const b: LngLat = [-80.049, 40.441];
		const c: LngLat = [-80.048, 40.4405];
		const whole = drivingLineLengthFeet(courseWithLine([a, b, c]));
		const parts = drivingLineLengthFeet(courseWithLine([a, b])) + drivingLineLengthFeet(courseWithLine([b, c]));
		expect(whole).toBeCloseTo(parts, 8);
	});
});
