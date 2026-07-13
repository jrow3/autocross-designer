import { describe, expect, it } from 'vitest';
import { computeGateCones, computeDirectionalCones } from './gateLogic';
import { haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const CENTER: LngLat = [-80.05, 40.44];
const DIRECTION: LngLat = [-80.049, 40.4405];

function toLocalMeters(from: LngLat, to: LngLat): [number, number] {
	const cosLat = Math.cos(from[1] * Math.PI / 180);
	return [(to[0] - from[0]) * cosLat, to[1] - from[1]];
}

describe('computeGateCones (map mode)', () => {
	it('places the two cones gateWidthFeet apart', () => {
		const { left, right } = computeGateCones(CENTER, DIRECTION, 20, 'map');
		const dist = haversineFeet(left, right);
		expect(Math.abs(dist - 20) / 20).toBeLessThan(0.01);
	});

	it('centers the gate on the click point', () => {
		const { left, right } = computeGateCones(CENTER, DIRECTION, 20, 'map');
		expect((left[0] + right[0]) / 2).toBeCloseTo(CENTER[0], 12);
		expect((left[1] + right[1]) / 2).toBeCloseTo(CENTER[1], 12);
	});

	it('makes the cone-to-cone line perpendicular to the gate direction', () => {
		const { left, right } = computeGateCones(CENTER, DIRECTION, 20, 'map');
		const gate = toLocalMeters(CENTER, DIRECTION);
		const across = toLocalMeters(left, right);
		const dot = gate[0] * across[0] + gate[1] * across[1];
		const cosAngle = dot / (Math.hypot(...gate) * Math.hypot(...across));
		expect(Math.abs(cosAngle)).toBeLessThan(0.02);
	});
});

describe('computeGateCones (image mode)', () => {
	it('computes exact pixel offsets perpendicular to the direction', () => {
		const center: LngLat = [100, 100];
		const direction: LngLat = [200, 100];
		const { left, right } = computeGateCones(center, direction, 10, 'image', 0.5);
		expect(left[0]).toBeCloseTo(100, 10);
		expect(left[1]).toBeCloseTo(110, 10);
		expect(right[0]).toBeCloseTo(100, 10);
		expect(right[1]).toBeCloseTo(90, 10);
	});

	it('defaults feetPerPixel to 1 when omitted', () => {
		const { left, right } = computeGateCones([0, 0], [10, 0], 8, 'image');
		expect(left[1]).toBeCloseTo(4, 10);
		expect(right[1]).toBeCloseTo(-4, 10);
	});
});

describe('computeDirectionalCones', () => {
	it('spans gateWidthFeet plus 3 feet of offset on each side', () => {
		const { leftDirectional, rightDirectional } = computeDirectionalCones(
			CENTER, DIRECTION, 20, 'map'
		);
		const dist = haversineFeet(leftDirectional, rightDirectional);
		expect(Math.abs(dist - 26) / 26).toBeLessThan(0.01);
	});

	it('image mode: exact pixel span of width + 6 feet', () => {
		const { leftDirectional, rightDirectional } = computeDirectionalCones(
			[100, 100], [200, 100], 10, 'image', 1
		);
		expect(leftDirectional[1]).toBeCloseTo(108, 10);
		expect(rightDirectional[1]).toBeCloseTo(92, 10);
	});
});
