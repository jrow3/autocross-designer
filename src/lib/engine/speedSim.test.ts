import { describe, it, expect } from 'vitest';
import { simulate } from './speedSim';
import { carProfile } from '$lib/config/carProfiles';
import { feetToLngLatOffset } from './geo';
import type { LngLat, WaypointData } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];
const STREET = carProfile('street');

const wp = (lngLat: LngLat): WaypointData => ({ lngLat });

function circleWaypoints(radiusFt: number, points = 24): WaypointData[] {
	const center = feetToLngLatOffset(ORIGIN, 90, radiusFt);
	const pts: WaypointData[] = [];
	for (let i = 0; i <= points; i++) {
		pts.push(wp(feetToLngLatOffset(center, (i / points) * 360, radiusFt)));
	}
	return pts;
}

describe('simulate', () => {
	it('returns null on degenerate input', () => {
		expect(simulate([], STREET, 'map')).toBeNull();
		expect(simulate([wp(ORIGIN)], STREET, 'map')).toBeNull();
		expect(simulate([wp([100, 100]), wp([200, 200])], STREET, 'image')).toBeNull(); // no scale
	});

	it('accelerates on a straight and never exceeds top speed', () => {
		const line = [wp(ORIGIN), wp(feetToLngLatOffset(ORIGIN, 90, 4000))];
		const sim = simulate(line, STREET, 'map')!;
		expect(sim.maxSpeedMph).toBeLessThanOrEqual(STREET.topSpeedMph + 0.01);
		expect(sim.maxSpeedMph).toBeGreaterThan(60);
		// speeds monotonically rise from the standing start on a pure straight
		const speeds = sim.points.map((p) => p.speedMph);
		expect(speeds[0]).toBe(0);
		expect(speeds[10]).toBeGreaterThan(speeds[2]);
	});

	it('holds corner speed near sqrt(latG*g*R) on a constant-radius circle', () => {
		const radius = 100;
		const sim = simulate(circleWaypoints(radius), STREET, 'map')!;
		const expected = Math.sqrt(STREET.latG * 32.174 * radius) * 0.681818;
		const mid = sim.points.slice(40, sim.points.length - 40);
		const avg = mid.reduce((a, p) => a + p.speedMph, 0) / mid.length;
		expect(Math.abs(avg - expected) / expected).toBeLessThan(0.1);
	});

	it('brakes before a corner (backward pass)', () => {
		// long straight into a tight 25 ft hairpin
		const cornerStart = feetToLngLatOffset(ORIGIN, 90, 800);
		const apex = feetToLngLatOffset(cornerStart, 45, 35);
		const exit = feetToLngLatOffset(cornerStart, 0, 70);
		const sim = simulate([wp(ORIGIN), wp(cornerStart), wp(apex), wp(exit)], STREET, 'map')!;
		// max speed happens on the straight, then drops for the corner
		const maxIdx = sim.points.findIndex((p) => p.speedMph === sim.maxSpeedMph);
		const after = sim.points.slice(maxIdx).map((p) => p.speedMph);
		expect(Math.min(...after)).toBeLessThan(sim.maxSpeedMph * 0.7);
	});

	it('respects the braking-rate invariant between samples', () => {
		const cornerStart = feetToLngLatOffset(ORIGIN, 90, 600);
		const apex = feetToLngLatOffset(cornerStart, 45, 30);
		const sim = simulate([wp(ORIGIN), wp(cornerStart), wp(apex)], STREET, 'map')!;
		const maxDecel = STREET.brakeG * 32.174;
		for (let i = 1; i < sim.points.length; i++) {
			const v0 = sim.points[i - 1].speedMph / 0.681818;
			const v1 = sim.points[i].speedMph / 0.681818;
			const ds = sim.points[i].sFt - sim.points[i - 1].sFt;
			if (v1 < v0) {
				expect(v0 * v0 - v1 * v1).toBeLessThanOrEqual(2 * maxDecel * ds + 1);
			}
		}
	});

	it('produces close results in map and image mode for congruent geometry', () => {
		const mapLine = [wp(ORIGIN), wp(feetToLngLatOffset(ORIGIN, 90, 1000))];
		// image: 1000 ft straight at 0.25 ft/px = 4000 px
		const imageLine = [wp([100, 400] as LngLat), wp([4100, 400] as LngLat)];
		const simMap = simulate(mapLine, STREET, 'map')!;
		const simImage = simulate(imageLine, STREET, 'image', 0.25)!;
		expect(Math.abs(simMap.timeSec - simImage.timeSec) / simMap.timeSec).toBeLessThan(0.02);
		expect(Math.abs(simMap.maxSpeedMph - simImage.maxSpeedMph)).toBeLessThan(1);
	});

	it('reports sensible aggregates', () => {
		const line = [wp(ORIGIN), wp(feetToLngLatOffset(ORIGIN, 90, 2000))];
		const sim = simulate(line, STREET, 'map')!;
		expect(sim.lengthFt).toBeGreaterThan(1990);
		expect(sim.lengthFt).toBeLessThan(2010);
		expect(sim.timeSec).toBeGreaterThan(15);
		expect(sim.timeSec).toBeLessThan(45);
		expect(sim.avgSpeedMph).toBeGreaterThan(0);
		expect(sim.avgSpeedMph).toBeLessThanOrEqual(sim.maxSpeedMph);
		expect(sim.profileId).toBe('street');
		expect(sim.points.every((p) => Number.isFinite(p.speedMph))).toBe(true);
	});
});
