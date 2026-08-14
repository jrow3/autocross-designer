import { describe, it, expect } from 'vitest';
import { generateCourse, type GeneratorOptions } from './courseGenerator';
import { feetToLngLatOffset } from '../geo';
import type { LngLat, WaypointData } from '$lib/types/course';

const ORIGIN: LngLat = [-96.769, 40.845];
const wp = (lngLat: LngLat): WaypointData => ({ lngLat });

const BASE: GeneratorOptions = {
	seed: 42,
	eventType: 'regional',
	biggerSweeper: false,
	widerGates: false,
	leanMode: false
};

const NO_OBSTACLES = { hazards: [], outline: [] };

function hookCourse(): WaypointData[] {
	// long straight, tight corner, straight back
	const a = ORIGIN;
	const b = feetToLngLatOffset(ORIGIN, 90, 900);
	const c = feetToLngLatOffset(b, 45, 60);
	const d = feetToLngLatOffset(b, 0, 80);
	const e = feetToLngLatOffset(d, 0, 700);
	return [a, b, c, d, e].map(wp);
}

describe('generateCourse', () => {
	it('returns null on degenerate input', () => {
		expect(generateCourse([], BASE, 'map', undefined, NO_OBSTACLES)).toBeNull();
		expect(generateCourse([wp(ORIGIN)], BASE, 'map', undefined, NO_OBSTACLES)).toBeNull();
		expect(generateCourse(hookCourse(), BASE, 'image', undefined, NO_OBSTACLES)).toBeNull();
	});

	it('is deterministic for the same seed and differs across seeds', () => {
		const a = generateCourse(hookCourse(), BASE, 'map', undefined, NO_OBSTACLES)!;
		const b = generateCourse(hookCourse(), BASE, 'map', undefined, NO_OBSTACLES)!;
		expect(a).toEqual(b);
		const c = generateCourse(hookCourse(), { ...BASE, seed: 43 }, 'map', undefined, NO_OBSTACLES)!;
		expect(c).not.toEqual(a);
	});

	it('places start and finish gates and a slalom on the long straight', () => {
		const result = generateCourse(hookCourse(), BASE, 'map', undefined, NO_OBSTACLES)!;
		expect(result.cones.filter((c) => c.type === 'start-cone')).toHaveLength(2);
		expect(result.cones.filter((c) => c.type === 'finish-cone')).toHaveLength(2);
		expect(result.stats.slalomCount).toBeGreaterThanOrEqual(1);
		expect(result.stats.coneCount).toBeGreaterThan(8);
	});

	it('lean mode places strictly fewer cones', () => {
		const normal = generateCourse(hookCourse(), BASE, 'map', undefined, NO_OBSTACLES)!;
		const lean = generateCourse(hookCourse(), { ...BASE, leanMode: true }, 'map', undefined, NO_OBSTACLES)!;
		expect(lean.stats.coneCount).toBeLessThan(normal.stats.coneCount);
	});

	it('drops cones inside hazard buffers with a warning', () => {
		// hazard sitting mid-straight where the slalom lands
		const hazardAt = feetToLngLatOffset(ORIGIN, 90, 450);
		const withHazard = generateCourse(hookCourse(), BASE, 'map', undefined, {
			hazards: [{ id: 'h1', type: 'point', coordinates: [hazardAt], bufferFeet: 60 }],
			outline: []
		})!;
		const without = generateCourse(hookCourse(), BASE, 'map', undefined, NO_OBSTACLES)!;
		expect(withHazard.stats.coneCount).toBeLessThan(without.stats.coneCount);
		expect(withHazard.warnings.some((w) => w.includes('hazard'))).toBe(true);
		// and no surviving cone violates the buffer
		for (const cone of withHazard.cones) {
			const dLng = cone.lngLat[0] - hazardAt[0];
			const dLat = cone.lngLat[1] - hazardAt[1];
			// rough degrees->feet at this latitude
			const feet = Math.hypot(dLng * 278000, dLat * 364000);
			expect(feet).toBeGreaterThan(55);
		}
	});

	it('keeps the finish runout clear', () => {
		const result = generateCourse(hookCourse(), BASE, 'map', undefined, NO_OBSTACLES)!;
		const finishCones = result.cones.filter((c) => c.type === 'finish-cone');
		const finishMid: LngLat = [
			(finishCones[0].lngLat[0] + finishCones[1].lngLat[0]) / 2,
			(finishCones[0].lngLat[1] + finishCones[1].lngLat[1]) / 2
		];
		// no regular cone within ~100 ft of the finish line
		const near = result.cones.filter((c) => {
			if (c.type !== 'regular') return false;
			const dLng = (c.lngLat[0] - finishMid[0]) * 278000;
			const dLat = (c.lngLat[1] - finishMid[1]) * 364000;
			return Math.hypot(dLng, dLat) < 100;
		});
		expect(near).toHaveLength(0);
	});

	it('places an inside apex cone with a pointer on the corner', () => {
		const result = generateCourse(hookCourse(), BASE, 'map', undefined, NO_OBSTACLES)!;
		expect(result.cones.some((c) => c.type === 'pointer')).toBe(true);
	});

	it('strings inside cones along a long sweeper, not just one apex', () => {
		// straight in, 180-degree sweeper of radius 80, straight out
		const center = feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 90, 400), 0, 80);
		const wps: WaypointData[] = [wp(ORIGIN)];
		for (let deg = 180; deg >= 0; deg -= 20) {
			wps.push(wp(feetToLngLatOffset(center, deg, 80)));
		}
		wps.push(wp(feetToLngLatOffset(feetToLngLatOffset(center, 0, 80), 0, 400)));
		const result = generateCourse(wps, BASE, 'map', undefined, NO_OBSTACLES)!;

		// count regular cones hugging the inside of the arc (radius - 2 ft offset)
		const arcCones = result.cones.filter((c) => {
			if (c.type !== 'regular') return false;
			const dLng = (c.lngLat[0] - center[0]) * 278000;
			const dLat = (c.lngLat[1] - center[1]) * 364000;
			const dist = Math.hypot(dLng, dLat);
			return dist > 65 && dist < 82;
		});
		expect(arcCones.length).toBeGreaterThanOrEqual(4);
	});

	it('flips cone side through an S-curve', () => {
		// left arc around c1 then right arc around c2 — inside flips halfway
		const c1 = feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 90, 250), 0, 90);
		const c2 = feetToLngLatOffset(c1, 90, 180);
		const wps: WaypointData[] = [wp(ORIGIN)];
		for (let deg = 180; deg >= 90; deg -= 15) {
			wps.push(wp(feetToLngLatOffset(c1, deg, 90)));
		}
		for (let deg = 270; deg <= 360; deg += 15) {
			wps.push(wp(feetToLngLatOffset(c2, deg, 90)));
		}
		wps.push(wp(feetToLngLatOffset(feetToLngLatOffset(c2, 0, 90), 90, 250)));
		const result = generateCourse(wps, BASE, 'map', undefined, NO_OBSTACLES)!;

		const nearCenter = (center: [number, number]) =>
			result.cones.filter((c) => {
				if (c.type !== 'regular') return false;
				const dLng = (c.lngLat[0] - center[0]) * 278000;
				const dLat = (c.lngLat[1] - center[1]) * 364000;
				const dist = Math.hypot(dLng, dLat);
				return dist > 74 && dist < 92;
			});
		// inside cones hug each arc's own center — both halves get some
		expect(nearCenter(c1).length).toBeGreaterThanOrEqual(1);
		expect(nearCenter(c2).length).toBeGreaterThanOrEqual(1);
	});

	it('produces congruent output in image mode', () => {
		// same hook, 0.25 ft/px
		const img = (p: [number, number]): WaypointData => wp([p[0], p[1]] as LngLat);
		const line = [img([100, 700]), img([3700, 700]), img([3860, 530]), img([3700, 380]), img([900, 380])];
		const result = generateCourse(line, BASE, 'image', 0.25, NO_OBSTACLES)!;
		expect(result.stats.coneCount).toBeGreaterThan(8);
		expect(result.cones.filter((c) => c.type === 'start-cone')).toHaveLength(2);
	});
});
