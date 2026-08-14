import { describe, it, expect, beforeEach } from 'vitest';
import { simStore } from './simStore.svelte';
import { courseStore } from './courseStore.svelte';
import { mapStore } from './mapStore.svelte';
import { emptyCourse } from '$lib/engine/courseSerializer';
import { feetToLngLatOffset } from '$lib/engine/geo';
import type { LngLat } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];

beforeEach(() => {
	courseStore.load(emptyCourse());
	mapStore.setMode('map');
	mapStore.setFeetPerPixel(null);
});

describe('simStore', () => {
	it('reports no-line without a driving line', () => {
		simStore.flushNow();
		expect(simStore.status).toBe('no-line');
		expect(simStore.result).toBeNull();
	});

	it('computes a result for a valid line', () => {
		courseStore.addWaypoint({ lngLat: ORIGIN });
		courseStore.addWaypoint({ lngLat: feetToLngLatOffset(ORIGIN, 90, 1500) });
		simStore.flushNow();
		expect(simStore.status).toBe('ready');
		expect(simStore.result!.lengthFt).toBeGreaterThan(1400);
		expect(simStore.result!.timeSec).toBeGreaterThan(0);
	});

	it('reports needs-scale in uncalibrated image mode', () => {
		mapStore.setMode('image');
		courseStore.addWaypoint({ lngLat: [100, 100] });
		courseStore.addWaypoint({ lngLat: [900, 100] });
		simStore.flushNow();
		expect(simStore.status).toBe('needs-scale');

		mapStore.setFeetPerPixel(0.5);
		simStore.flushNow();
		expect(simStore.status).toBe('ready');
		expect(simStore.result!.lengthFt).toBeCloseTo(400, -1);
	});

	it('re-simulates with a different car profile', () => {
		courseStore.addWaypoint({ lngLat: ORIGIN });
		courseStore.addWaypoint({ lngLat: feetToLngLatOffset(ORIGIN, 90, 1500) });
		simStore.flushNow();
		const streetTime = simStore.result!.timeSec;

		simStore.setProfile('prepared');
		simStore.flushNow();
		expect(simStore.result!.profileId).toBe('prepared');
		expect(simStore.result!.timeSec).toBeLessThan(streetTime);
		simStore.setProfile('street');
	});
});
