import { describe, expect, it } from 'vitest';
import { computeCourseBounds } from './courseBounds';
import { emptyCourse } from './courseSerializer';
import type { CourseData, LngLat } from '$lib/types/course';

function cone(id: string, lngLat: LngLat) {
	return { id, type: 'regular' as const, lngLat, lockedTargetId: null };
}

function course(overrides: Partial<CourseData> = {}): CourseData {
	return { ...emptyCourse(), ...overrides };
}

describe('computeCourseBounds', () => {
	it('returns null for an empty course', () => {
		expect(computeCourseBounds(course())).toBeNull();
	});

	it('spans all element types', () => {
		const c = course({
			cones: [cone('c1', [-80.05, 40.44])],
			drivingLine: [{ lngLat: [-80.06, 40.43] }],
			measurements: [{ p1: [-80.04, 40.45], p2: [-80.045, 40.445], coneId1: null, coneId2: null }],
			notes: [{ id: 'n1', number: 1, text: 'x', lngLat: [-80.055, 40.46] }],
			workers: [{ id: 'w1', number: 1, lngLat: [-80.03, 40.42] }],
			courseOutline: [{ p1: [-80.07, 40.44], p2: [-80.05, 40.44], cp: [-80.06, 40.44] }],
			sketches: [{ id: 's1', points: [[-80.02, 40.47]] }]
		});
		expect(computeCourseBounds(c)).toEqual([[-80.07, 40.42], [-80.02, 40.47]]);
	});

	it('filters points far from the median cluster', () => {
		const c = course({
			cones: [
				cone('a', [-80.05, 40.44]),
				cone('b', [-80.051, 40.441]),
				cone('c', [-80.052, 40.442]),
				cone('outlier', [-122.4, 37.77])
			]
		});
		expect(computeCourseBounds(c)).toEqual([[-80.052, 40.44], [-80.05, 40.442]]);
	});

	it('falls back to all points when everything would be filtered out', () => {
		// Two points >1 degree apart in both axes: whichever is not the median gets filtered,
		// but the median point itself always survives, so bounds still exist.
		const c = course({ cones: [cone('a', [-80, 40]), cone('b', [-122, 37])] });
		expect(computeCourseBounds(c)).not.toBeNull();
	});
});
