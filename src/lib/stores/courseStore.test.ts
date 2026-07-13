import { beforeEach, describe, expect, it } from 'vitest';
import { courseStore } from './courseStore.svelte';
import { emptyCourse } from '$lib/engine/courseSerializer';
import type { ConeData } from '$lib/types/course';

function cone(id: string, lng = 0, lat = 0): ConeData {
	return { id, type: 'regular', lngLat: [lng, lat], lockedTargetId: null };
}

beforeEach(() => {
	courseStore.load(emptyCourse());
});

describe('courseStore', () => {
	it('adds and removes cones', () => {
		courseStore.addCone(cone('a'));
		expect(courseStore.course.cones).toHaveLength(1);
		courseStore.removeCone('a');
		expect(courseStore.course.cones).toHaveLength(0);
	});

	it('undo restores the snapshot taken by pushUndo', () => {
		courseStore.addCone(cone('a'));
		courseStore.pushUndo();
		courseStore.addCone(cone('b'));
		expect(courseStore.course.cones).toHaveLength(2);
		courseStore.undo();
		expect(courseStore.course.cones).toHaveLength(1);
		expect(courseStore.course.cones[0].id).toBe('a');
	});

	it('redo reapplies an undone change and pushUndo clears the redo stack', () => {
		courseStore.pushUndo();
		courseStore.addCone(cone('a'));
		courseStore.undo();
		expect(courseStore.canRedo).toBe(true);
		courseStore.redo();
		expect(courseStore.course.cones).toHaveLength(1);
		courseStore.pushUndo();
		expect(courseStore.canRedo).toBe(false);
	});

	it('undo restores map view and image fields, not just element arrays', () => {
		courseStore.setMapView([-80.05, 40.44], 17);
		courseStore.course.imageMode = true;
		courseStore.course.imageFileName = 'lot.png';
		courseStore.course.imageScale = 0.5;
		courseStore.pushUndo();
		courseStore.setMapView([0, 0], 3);
		courseStore.course.imageMode = false;
		courseStore.course.imageFileName = undefined;
		courseStore.course.imageScale = undefined;
		courseStore.addCone(cone('a'));
		courseStore.undo();
		expect(courseStore.course.mapCenter).toEqual([-80.05, 40.44]);
		expect(courseStore.course.mapZoom).toBe(17);
		expect(courseStore.course.imageMode).toBe(true);
		expect(courseStore.course.imageFileName).toBe('lot.png');
		expect(courseStore.course.imageScale).toBe(0.5);
		expect(courseStore.course.cones).toHaveLength(0);
	});

	it('caps the undo stack at 50 snapshots, dropping the oldest', () => {
		for (let i = 0; i < 55; i++) {
			courseStore.addCone(cone(String(i)));
			courseStore.pushUndo();
		}
		let undos = 0;
		while (courseStore.canUndo) {
			courseStore.undo();
			undos++;
		}
		expect(undos).toBe(50);
		// Oldest snapshots were dropped; the earliest remaining one holds cones 0-5
		expect(courseStore.course.cones).toHaveLength(6);
	});

	it('applyVenue replaces hazards/obstacles and map view but preserves cones', () => {
		courseStore.addCone(cone('a'));
		courseStore.course.hazardMarkers = [
			{ id: 'old', type: 'point', coordinates: [[0, 0]], bufferFeet: 5 }
		];
		courseStore.course.obstacles = [{ id: 'old-obs', type: 'drain', lngLat: [0, 0] }];
		courseStore.applyVenue({
			mapCenter: [-80.05, 40.44],
			mapZoom: 17,
			hazardMarkers: [{ id: 'new', type: 'line', coordinates: [[1, 1], [2, 2]], bufferFeet: 10 }],
			obstacles: [{ id: 'new-obs', type: 'pole', lngLat: [1, 1] }]
		});
		expect(courseStore.course.hazardMarkers).toHaveLength(1);
		expect(courseStore.course.hazardMarkers[0].id).toBe('new');
		expect(courseStore.course.obstacles).toHaveLength(1);
		expect(courseStore.course.obstacles[0].id).toBe('new-obs');
		expect(courseStore.course.mapCenter).toEqual([-80.05, 40.44]);
		expect(courseStore.course.mapZoom).toBe(17);
		expect(courseStore.course.cones).toHaveLength(1);
		expect(courseStore.course.cones[0].id).toBe('a');
	});

	it('load resets both stacks and dedups repeated ids', () => {
		courseStore.pushUndo();
		const data = emptyCourse();
		data.cones = [cone('dup'), cone('dup')];
		courseStore.load(data);
		expect(courseStore.canUndo).toBe(false);
		expect(courseStore.canRedo).toBe(false);
		const [first, second] = courseStore.course.cones;
		expect(first.id).not.toBe(second.id);
	});
});
