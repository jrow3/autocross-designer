import { describe, expect, it } from 'vitest';
import { pickCourseItem, itemsInBox } from './hitTest';
import { emptyCourse } from '$lib/engine/courseSerializer';
import type { CourseData, LngLat } from '$lib/types/course';

const square: LngLat[] = [
	[-80.05, 40.44],
	[-80.04, 40.44],
	[-80.04, 40.45],
	[-80.05, 40.45]
];

function course(overrides: Partial<CourseData> = {}): CourseData {
	return { ...emptyCourse(), ...overrides };
}

describe('pickCourseItem', () => {
	it('picks a staging area when the point is inside its polygon', () => {
		const c = course({ stagingAreas: [{ id: 'sa1', vertices: square, label: 'STAGING' }] });
		expect(pickCourseItem(c, [-80.045, 40.445])).toEqual({ type: 'staging-area', id: 'sa1' });
	});

	it('returns null when the point is outside every polygon', () => {
		const c = course({ stagingAreas: [{ id: 'sa1', vertices: square, label: 'STAGING' }] });
		expect(pickCourseItem(c, [-80.06, 40.445])).toBeNull();
	});

	it('prefers a staging area over a worker zone covering the same point', () => {
		const c = course({
			stagingAreas: [{ id: 'sa1', vertices: square, label: 'STAGING' }],
			workerZones: [{ id: 'wz1', vertices: square, stationNumber: 1 }]
		});
		expect(pickCourseItem(c, [-80.045, 40.445])?.type).toBe('staging-area');
	});

	it('picks a worker zone when the point is inside it', () => {
		const c = course({ workerZones: [{ id: 'wz1', vertices: square, stationNumber: 1 }] });
		expect(pickCourseItem(c, [-80.045, 40.445])).toEqual({ type: 'worker-zone', id: 'wz1' });
	});

	it('picks the nearest hazard within the proximity threshold', () => {
		const c = course({
			hazardMarkers: [
				{ id: 'far', type: 'point', coordinates: [[-80.0502, 40.44]], bufferFeet: 25 },
				{ id: 'near', type: 'point', coordinates: [[-80.0501, 40.44]], bufferFeet: 25 }
			]
		});
		expect(pickCourseItem(c, [-80.05, 40.44])).toEqual({ type: 'hazard', id: 'near' });
	});

	it('ignores hazards beyond the proximity threshold', () => {
		const c = course({
			hazardMarkers: [{ id: 'hz1', type: 'point', coordinates: [[-80.051, 40.44]], bufferFeet: 25 }]
		});
		expect(pickCourseItem(c, [-80.05, 40.44])).toBeNull();
	});

	it('picks a sketch only when very close to one of its points', () => {
		const c = course({ sketches: [{ id: 'sk1', points: [[-80.05, 40.44], [-80.049, 40.441]] }] });
		expect(pickCourseItem(c, [-80.05001, 40.44])).toEqual({ type: 'sketch', id: 'sk1' });
		expect(pickCourseItem(c, [-80.0501, 40.44])).toBeNull();
	});
});

describe('itemsInBox', () => {
	// Identity projection: treat lngLat as screen pixels for test simplicity
	const project = (lngLat: LngLat) => ({ x: lngLat[0], y: lngLat[1] });
	const rect = { x: 0, y: 0, width: 100, height: 100 };

	it('collects cones and workers inside the box, skipping outside ones', () => {
		const c = course({
			cones: [
				{ id: 'in', type: 'regular', lngLat: [50, 50], lockedTargetId: null },
				{ id: 'out', type: 'regular', lngLat: [150, 50], lockedTargetId: null }
			],
			workers: [{ id: 'w1', number: 1, lngLat: [10, 10] }]
		});
		expect(itemsInBox(c, rect, project)).toEqual([
			{ type: 'cone', id: 'in' },
			{ type: 'worker', id: 'w1' }
		]);
	});

	it('selects measurements and outline segments by index when either endpoint is inside', () => {
		const c = course({
			measurements: [
				{ p1: [200, 200], p2: [50, 50], coneId1: null, coneId2: null },
				{ p1: [200, 200], p2: [300, 300], coneId1: null, coneId2: null }
			],
			courseOutline: [{ p1: [10, 10], p2: [200, 200], cp: [100, 100] }]
		});
		expect(itemsInBox(c, rect, project)).toEqual([
			{ type: 'measurement', id: '0' },
			{ type: 'outline', id: '0' }
		]);
	});

	it('includes polygons and sketches when any vertex falls inside the box', () => {
		const c = course({
			stagingAreas: [{ id: 'sa1', vertices: [[50, 50], [200, 200], [200, 50]], label: 'S' }],
			workerZones: [{ id: 'wz1', vertices: [[200, 200], [300, 300], [250, 200]], stationNumber: 1 }],
			sketches: [{ id: 'sk1', points: [[99, 99], [500, 500]] }],
			hazardMarkers: [{ id: 'hz1', type: 'line', coordinates: [[300, 300], [1, 1]], bufferFeet: 25 }]
		});
		expect(itemsInBox(c, rect, project)).toEqual([
			{ type: 'hazard', id: 'hz1' },
			{ type: 'staging-area', id: 'sa1' },
			{ type: 'sketch', id: 'sk1' }
		]);
	});

	it('treats box edges as inclusive', () => {
		const c = course({ cones: [{ id: 'edge', type: 'regular', lngLat: [100, 0], lockedTargetId: null }] });
		expect(itemsInBox(c, rect, project)).toEqual([{ type: 'cone', id: 'edge' }]);
	});
});
