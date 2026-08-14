import { describe, it, expect } from 'vitest';
import { gradientStops, speedColor } from './speedColors';
import { SPEED_RAMP } from '$lib/config/palette';
import type { SimResult } from './speedSim';

function fakeResult(speeds: number[]): SimResult {
	const n = speeds.length;
	return {
		points: speeds.map((speedMph, i) => ({
			lngLat: [0, 0],
			sFt: (i / (n - 1)) * 1000,
			speedMph,
			radiusFt: Infinity
		})),
		segments: [],
		lengthFt: 1000,
		timeSec: 30,
		avgSpeedMph: 30,
		maxSpeedMph: Math.max(...speeds),
		minSpeedMph: Math.min(...speeds),
		maxSpeedLocation: [0, 0],
		profileId: 'street'
	};
}

describe('speedColor', () => {
	it('returns ramp endpoints at 0 and 1', () => {
		expect(speedColor(0)).toBe(SPEED_RAMP[0]);
		expect(speedColor(1)).toBe(SPEED_RAMP[SPEED_RAMP.length - 1]);
	});

	it('clamps out-of-range input', () => {
		expect(speedColor(-1)).toBe(SPEED_RAMP[0]);
		expect(speedColor(2)).toBe(SPEED_RAMP[SPEED_RAMP.length - 1]);
	});
});

describe('gradientStops', () => {
	it('produces strictly increasing progress values in [0,1]', () => {
		const speeds = Array.from({ length: 300 }, (_, i) => 20 + Math.sin(i / 10) * 15);
		const stops = gradientStops(fakeResult(speeds));
		const progresses = stops.filter((_, i) => i % 2 === 0) as number[];
		expect(progresses[0]).toBeGreaterThanOrEqual(0);
		expect(progresses[progresses.length - 1]).toBeLessThanOrEqual(1);
		for (let i = 1; i < progresses.length; i++) {
			expect(progresses[i]).toBeGreaterThan(progresses[i - 1]);
		}
	});

	it('caps the stop count', () => {
		const speeds = Array.from({ length: 2000 }, (_, i) => i % 60);
		const stops = gradientStops(fakeResult(speeds), 64);
		expect(stops.length / 2).toBeLessThanOrEqual(66);
	});

	it('colors slow points with the start of the ramp', () => {
		const stops = gradientStops(fakeResult([10, 10, 10, 60]));
		expect(stops[1]).toBe(SPEED_RAMP[0]);
	});

	it('returns empty for empty input', () => {
		const result = fakeResult([0, 0]);
		result.points = [];
		expect(gradientStops(result)).toEqual([]);
	});
});
