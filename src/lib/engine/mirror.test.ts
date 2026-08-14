import { describe, it, expect } from 'vitest';
import { reflectAcrossAxis, distanceToAxisFeet } from './mirror';
import { makeFrame } from './planarFrame';
import { feetToLngLatOffset, haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];
const AXIS: [LngLat, LngLat] = [ORIGIN, feetToLngLatOffset(ORIGIN, 0, 500)]; // due north

describe('reflectAcrossAxis', () => {
	const frame = makeFrame(ORIGIN, 'map')!;

	it('is involutive', () => {
		const p = feetToLngLatOffset(ORIGIN, 63, 240);
		const twice = reflectAcrossAxis(reflectAcrossAxis(p, AXIS, frame), AXIS, frame);
		expect(twice[0]).toBeCloseTo(p[0], 9);
		expect(twice[1]).toBeCloseTo(p[1], 9);
	});

	it('preserves distances between reflected points', () => {
		const p1 = feetToLngLatOffset(ORIGIN, 80, 150);
		const p2 = feetToLngLatOffset(ORIGIN, 120, 320);
		const r1 = reflectAcrossAxis(p1, AXIS, frame);
		const r2 = reflectAcrossAxis(p2, AXIS, frame);
		expect(haversineFeet(r1, r2)).toBeCloseTo(haversineFeet(p1, p2), 1);
	});

	it('fixes points on the axis', () => {
		const onAxis = feetToLngLatOffset(ORIGIN, 0, 250);
		const r = reflectAcrossAxis(onAxis, AXIS, frame);
		expect(haversineFeet(onAxis, r)).toBeLessThan(0.01);
	});

	it('flips east to west across a north-south axis', () => {
		const east = feetToLngLatOffset(ORIGIN, 90, 100);
		const r = reflectAcrossAxis(east, AXIS, frame);
		expect(haversineFeet(r, feetToLngLatOffset(ORIGIN, 270, 100))).toBeLessThan(0.5);
	});

	it('works in image mode', () => {
		const imgFrame = makeFrame([600, 400], 'image', 0.25)!;
		const imgAxis: [LngLat, LngLat] = [
			[600, 100],
			[600, 700]
		];
		const r = reflectAcrossAxis([700, 300], imgAxis, imgFrame);
		expect(r[0]).toBeCloseTo(500);
		expect(r[1]).toBeCloseTo(300);
	});
});

describe('distanceToAxisFeet', () => {
	const frame = makeFrame(ORIGIN, 'map')!;

	it('measures perpendicular distance', () => {
		const p = feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 0, 200), 90, 35);
		expect(distanceToAxisFeet(p, AXIS, frame)).toBeCloseTo(35, 0);
	});

	it('reads near zero on the axis', () => {
		expect(distanceToAxisFeet(feetToLngLatOffset(ORIGIN, 0, 300), AXIS, frame)).toBeLessThan(0.01);
	});
});
