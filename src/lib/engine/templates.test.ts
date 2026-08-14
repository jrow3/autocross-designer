import { describe, it, expect } from 'vitest';
import { instantiateTemplate } from './templates';
import { COURSE_TEMPLATES } from '$lib/config/courseTemplates';
import { haversineFeet } from './geo';
import type { LngLat } from '$lib/types/course';

const CENTER: LngLat = [-96.769, 40.845];

describe('instantiateTemplate', () => {
	it('reproduces inter-waypoint distances in map mode within 0.5 ft', () => {
		for (const template of COURSE_TEMPLATES) {
			const waypoints = instantiateTemplate(template, CENTER, 'map')!;
			for (let i = 1; i < waypoints.length; i++) {
				const [ax, ay] = template.waypointOffsetsFt[i - 1];
				const [bx, by] = template.waypointOffsetsFt[i];
				const expected = Math.hypot(bx - ax, by - ay);
				const actual = haversineFeet(waypoints[i - 1].lngLat, waypoints[i].lngLat);
				expect(Math.abs(actual - expected)).toBeLessThan(0.5);
			}
		}
	});

	it('reproduces distances in image mode by scale', () => {
		const template = COURSE_TEMPLATES[0];
		const waypoints = instantiateTemplate(template, [600, 400], 'image', 0.5)!;
		const [ax, ay] = template.waypointOffsetsFt[0];
		const [bx, by] = template.waypointOffsetsFt[1];
		const expected = Math.hypot(bx - ax, by - ay);
		const dx = (waypoints[1].lngLat[0] - waypoints[0].lngLat[0]) * 0.5;
		const dy = (waypoints[1].lngLat[1] - waypoints[0].lngLat[1]) * 0.5;
		expect(Math.hypot(dx, dy)).toBeCloseTo(expected, 5);
	});

	it('returns null in uncalibrated image mode', () => {
		expect(instantiateTemplate(COURSE_TEMPLATES[0], [0, 0], 'image')).toBeNull();
	});

	it('every template is a plausible course length', () => {
		for (const template of COURSE_TEMPLATES) {
			let length = 0;
			for (let i = 1; i < template.waypointOffsetsFt.length; i++) {
				const [ax, ay] = template.waypointOffsetsFt[i - 1];
				const [bx, by] = template.waypointOffsetsFt[i];
				length += Math.hypot(bx - ax, by - ay);
			}
			expect(length).toBeGreaterThan(1200);
			expect(length).toBeLessThan(4500);
		}
	});
});
