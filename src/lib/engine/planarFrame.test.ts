import { describe, it, expect } from 'vitest';
import { makeFrame } from './planarFrame';
import { feetToLngLatOffset, haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];

describe('makeFrame map mode', () => {
	const frame = makeFrame(ORIGIN, 'map')!;

	it('round-trips toFeet -> fromFeet', () => {
		const p: LngLat = [-96.768, 40.8455];
		const back = frame.fromFeet(frame.toFeet(p));
		expect(back[0]).toBeCloseTo(p[0], 10);
		expect(back[1]).toBeCloseTo(p[1], 10);
	});

	it('matches haversine distance within 0.1% at course scale', () => {
		const a = ORIGIN;
		const b = feetToLngLatOffset(ORIGIN, 63, 2500);
		const [ax, ay] = frame.toFeet(a);
		const [bx, by] = frame.toFeet(b);
		const planar = Math.hypot(bx - ax, by - ay);
		const actual = haversineFeet(a, b);
		expect(Math.abs(planar - actual) / actual).toBeLessThan(0.001);
	});

	it('has y-up handedness', () => {
		expect(frame.handedness).toBe(1);
		const north = feetToLngLatOffset(ORIGIN, 0, 100);
		expect(frame.toFeet(north)[1]).toBeGreaterThan(0);
	});
});

describe('makeFrame image mode', () => {
	const frame = makeFrame([600, 400], 'image', 0.25)!;

	it('converts pixels to feet by scale', () => {
		const [x, y] = frame.toFeet([700, 400]);
		expect(x).toBeCloseTo(25);
		expect(y).toBeCloseTo(0);
	});

	it('round-trips', () => {
		const back = frame.fromFeet(frame.toFeet([712, 519]));
		expect(back[0]).toBeCloseTo(712);
		expect(back[1]).toBeCloseTo(519);
	});

	it('has y-down handedness', () => {
		expect(frame.handedness).toBe(-1);
	});

	it('returns null without a calibrated scale', () => {
		expect(makeFrame([0, 0], 'image')).toBeNull();
		expect(makeFrame([0, 0], 'image', 0)).toBeNull();
	});
});
