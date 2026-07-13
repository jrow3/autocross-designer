import { describe, expect, it } from 'vitest';
import { distanceFeet, feetToLngLatOffset, feetToPixelOffset, haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const BASE: LngLat = [-80.05, 40.44];

function relativeError(actual: number, expected: number): number {
	return Math.abs(actual - expected) / expected;
}

describe('haversineFeet', () => {
	it('measures a 0.001 degree latitude step as ~364.8 feet', () => {
		const north: LngLat = [BASE[0], BASE[1] + 0.001];
		expect(relativeError(haversineFeet(BASE, north), 364.8)).toBeLessThan(0.01);
	});

	it('measures a 0.001 degree longitude step at lat 40.44 as ~277.7 feet', () => {
		const east: LngLat = [BASE[0] + 0.001, BASE[1]];
		expect(relativeError(haversineFeet(BASE, east), 277.7)).toBeLessThan(0.01);
	});

	it('returns 0 for identical points', () => {
		expect(haversineFeet(BASE, BASE)).toBe(0);
	});

	it('is symmetric', () => {
		const other: LngLat = [BASE[0] + 0.0005, BASE[1] + 0.0003];
		expect(haversineFeet(BASE, other)).toBeCloseTo(haversineFeet(other, BASE), 10);
	});
});

describe('feetToLngLatOffset', () => {
	it('round-trips: offset by N feet measures back as N feet', () => {
		for (const bearing of [0, 30, 90, 135, 270]) {
			const moved = feetToLngLatOffset(BASE, bearing, 20);
			expect(relativeError(haversineFeet(BASE, moved), 20)).toBeLessThan(0.01);
		}
	});

	it('bearing 0 moves north, bearing 90 moves east', () => {
		const north = feetToLngLatOffset(BASE, 0, 50);
		expect(north[1]).toBeGreaterThan(BASE[1]);
		expect(north[0]).toBeCloseTo(BASE[0], 10);

		const east = feetToLngLatOffset(BASE, 90, 50);
		expect(east[0]).toBeGreaterThan(BASE[0]);
		expect(east[1]).toBeCloseTo(BASE[1], 10);
	});
});

describe('feetToPixelOffset', () => {
	it('uses screen-space y (down is positive): bearing 0 decreases y', () => {
		const origin: LngLat = [100, 100];
		const up = feetToPixelOffset(origin, 0, 10, 0.5);
		expect(up[0]).toBeCloseTo(100, 10);
		expect(up[1]).toBeCloseTo(80, 10);

		const right = feetToPixelOffset(origin, 90, 10, 0.5);
		expect(right[0]).toBeCloseTo(120, 10);
		expect(right[1]).toBeCloseTo(100, 10);
	});
});

describe('distanceFeet', () => {
	it('map mode dispatches to haversine', () => {
		const north: LngLat = [BASE[0], BASE[1] + 0.001];
		expect(distanceFeet(BASE, north, 'map')).toBe(haversineFeet(BASE, north));
	});

	it('image mode multiplies pixel distance by feetPerPixel', () => {
		expect(distanceFeet([0, 0], [3, 4], 'image', 2)).toBe(10);
	});

	it('image mode without feetPerPixel returns null', () => {
		expect(distanceFeet([0, 0], [3, 4], 'image')).toBeNull();
	});

	it('map mode ignores feetPerPixel', () => {
		const north: LngLat = [BASE[0], BASE[1] + 0.001];
		expect(distanceFeet(BASE, north, 'map', 2)).toBe(haversineFeet(BASE, north));
	});
});
