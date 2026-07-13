import { describe, expect, it } from 'vitest';
import { deserialize, emptyCourse, validate } from './courseSerializer';
import type { ConeData, CourseData, LngLat } from '$lib/types/course';

const A: LngLat = [-80.05, 40.44];
const B: LngLat = [-80.049, 40.441];

function fullCourse(): CourseData {
	const cone: ConeData = {
		id: 'c1',
		type: 'regular',
		lngLat: A,
		lockedTargetId: 'c2',
		width: 2,
		height: 3,
		rotation: 45
	};
	return {
		schemaVersion: 1,
		cones: [cone],
		drivingLine: [{ lngLat: A }, { lngLat: B }],
		measurements: [{ p1: A, p2: B, coneId1: 'c1', coneId2: null }],
		notes: [{ id: 'n1', number: 1, text: 'watch the apex', lngLat: A }],
		obstacles: [{ id: 'o1', type: 'pole', lngLat: B }],
		workers: [{ id: 'w1', number: 2, name: 'Sam', lngLat: A }],
		courseOutline: [{ p1: A, p2: B, cp: [-80.0495, 40.4405] }],
		sketches: [{ id: 's1', points: [A, B] }],
		stagingAreas: [{ id: 'sa1', vertices: [A, B, [-80.05, 40.441]], label: 'Grid A' }],
		workerZones: [{ id: 'z1', vertices: [A, B, [-80.05, 40.441]], stationNumber: 3 }],
		hazardMarkers: [{ id: 'h1', type: 'line', coordinates: [A, B], bufferFeet: 10 }],
		coneNumbers: { c1: '301' },
		mapCenter: A,
		mapZoom: 18,
		imageMode: true,
		imageFileName: 'lot.png',
		imageScale: 0.5
	};
}

describe('deserialize', () => {
	it('round-trips a full course through JSON without losing fields', () => {
		const course = fullCourse();
		expect(deserialize(JSON.parse(JSON.stringify(course)))).toEqual(course);
	});

	it('accepts a JSON string', () => {
		const course = fullCourse();
		expect(deserialize(JSON.stringify(course))).toEqual(course);
	});

	it('yields the empty course for garbage input', () => {
		expect(deserialize('not json at all')).toEqual(emptyCourse());
		expect(deserialize(null)).toEqual(emptyCourse());
	});

	it('fills missing fields from the empty course', () => {
		const result = deserialize({ cones: [], mapZoom: 15 });
		expect(result.mapZoom).toBe(15);
		expect(result.drivingLine).toEqual([]);
		expect(result.mapCenter).toEqual(emptyCourse().mapCenter);
	});

	it('stamps schemaVersion regardless of input', () => {
		expect(deserialize({}).schemaVersion).toBe(1);
		expect(deserialize({ schemaVersion: 99 }).schemaVersion).toBe(1);
	});
});

describe('validate', () => {
	it('drops non-array values in array fields', () => {
		const data = { cones: 'nope', drivingLine: 5, notes: [] };
		validate(data);
		expect(data).not.toHaveProperty('cones');
		expect(data).not.toHaveProperty('drivingLine');
		expect(data.notes).toEqual([]);
		expect(deserialize({ cones: 'nope' }).cones).toEqual([]);
	});

	it('truncates arrays longer than 5000 items', () => {
		const data: Record<string, unknown> = { cones: new Array(5001).fill({}) };
		validate(data);
		expect(data.cones).toHaveLength(5000);
	});

	it('strips __proto__, constructor, and prototype keys recursively', () => {
		const data = JSON.parse(
			'{"__proto__":{"polluted":true},"cones":[{"constructor":1,"id":"c1"}],"prototype":2}'
		);
		validate(data);
		expect(Object.keys(data)).not.toContain('__proto__');
		expect(Object.keys(data)).not.toContain('prototype');
		expect(Object.keys(data.cones[0])).toEqual(['id']);
	});

	it('resets coneNumbers when it is not a plain object', () => {
		const data: Record<string, unknown> = { coneNumbers: ['301'] };
		validate(data);
		expect(data.coneNumbers).toEqual({});
	});
});
