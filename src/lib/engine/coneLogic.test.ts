import { describe, expect, it } from 'vitest';
import { findNearestRegularCone, computePointerRotation, offsetPointerPosition } from './coneLogic';
import { haversineFeet } from './geo';
import type { ConeData, LngLat } from '$lib/types/course';

const BASE: LngLat = [-80.05, 40.44];

function cone(id: string, lngLat: LngLat, type: ConeData['type'] = 'regular'): ConeData {
	return { id, type, lngLat, lockedTargetId: null };
}

describe('findNearestRegularCone', () => {
	it('returns the closest non-pointer cone', () => {
		const cones = [
			cone('far', [BASE[0] + 0.01, BASE[1]]),
			cone('near', [BASE[0] + 0.0001, BASE[1]])
		];
		expect(findNearestRegularCone(BASE, cones)?.id).toBe('near');
	});

	it('skips pointer cones even when they are closest', () => {
		const cones = [
			cone('ptr', [BASE[0] + 0.00001, BASE[1]], 'pointer'),
			cone('reg', [BASE[0] + 0.001, BASE[1]])
		];
		expect(findNearestRegularCone(BASE, cones)?.id).toBe('reg');
	});

	it('returns null when only pointer cones exist', () => {
		expect(findNearestRegularCone(BASE, [cone('p', BASE, 'pointer')])).toBeNull();
		expect(findNearestRegularCone(BASE, [])).toBeNull();
	});
});

describe('computePointerRotation', () => {
	it('map mode: 0 degrees for a target due north, 90 for due east', () => {
		const pointer = cone('p', BASE, 'pointer');
		const north = [cone('n', [BASE[0], BASE[1] + 0.001])];
		expect(computePointerRotation(pointer, north, 'map')).toBeCloseTo(0, 6);
		const east = [cone('e', [BASE[0] + 0.001, BASE[1]])];
		expect(computePointerRotation(pointer, east, 'map')).toBeCloseTo(90, 6);
	});

	it('uses the locked target over a nearer cone', () => {
		const pointer = cone('p', BASE, 'pointer');
		pointer.lockedTargetId = 'west';
		const cones = [
			cone('east-near', [BASE[0] + 0.0001, BASE[1]]),
			cone('west', [BASE[0] - 0.001, BASE[1]])
		];
		expect(computePointerRotation(pointer, cones, 'map')).toBeCloseTo(-90, 6);
		expect(pointer.lockedTargetId).toBe('west');
	});

	it('clears a stale lockedTargetId and falls back to the nearest cone', () => {
		const pointer = cone('p', BASE, 'pointer');
		pointer.lockedTargetId = 'ghost';
		const cones = [cone('north', [BASE[0], BASE[1] + 0.001])];
		expect(computePointerRotation(pointer, cones, 'map')).toBeCloseTo(0, 6);
		expect(pointer.lockedTargetId).toBeNull();
	});

	it('returns 0 with no target available', () => {
		expect(computePointerRotation(cone('p', BASE, 'pointer'), [], 'map')).toBe(0);
	});

	it('image mode: screen-space angle (target below is 180)', () => {
		const pointer = cone('p', [100, 100], 'pointer');
		const below = [cone('b', [100, 110])];
		expect(computePointerRotation(pointer, below, 'image')).toBeCloseTo(180, 6);
		const right = [cone('r', [110, 100])];
		expect(computePointerRotation(pointer, right, 'image')).toBeCloseTo(90, 6);
	});
});

describe('offsetPointerPosition', () => {
	it('map mode: places the pointer 5 feet from the nearest cone, same direction as the click', () => {
		const anchor = cone('a', BASE);
		const click: LngLat = [BASE[0] + 0.00004, BASE[1]];
		const result = offsetPointerPosition(click, [anchor], 'map');
		const dist = haversineFeet(BASE, result);
		expect(Math.abs(dist - 5) / 5).toBeLessThan(0.01);
		expect(result[0]).toBeGreaterThan(BASE[0]);
		expect(result[1]).toBeCloseTo(BASE[1], 8);
	});

	it('image mode: exact 5-foot pixel offset', () => {
		const anchor = cone('a', [100, 100]);
		const result = offsetPointerPosition([110, 100], [anchor], 'image', 1);
		expect(result[0]).toBeCloseTo(105, 10);
		expect(result[1]).toBeCloseTo(100, 10);
	});

	it('returns the click unchanged with no regular cones', () => {
		expect(offsetPointerPosition(BASE, [], 'map')).toEqual(BASE);
	});

	it('returns the click unchanged when it lands exactly on the cone', () => {
		expect(offsetPointerPosition(BASE, [cone('a', BASE)], 'map')).toEqual(BASE);
	});

	it('image mode without feetPerPixel returns the click unchanged', () => {
		const result = offsetPointerPosition([110, 100], [cone('a', [100, 100])], 'image');
		expect(result).toEqual([110, 100]);
	});
});
