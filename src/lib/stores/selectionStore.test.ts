import { beforeEach, describe, expect, it } from 'vitest';
import { courseStore } from './courseStore.svelte';
import { selectionStore } from './selectionStore.svelte';
import { emptyCourse } from '$lib/engine/courseSerializer';
import type { ConeData } from '$lib/types/course';

function cone(id: string): ConeData {
	return { id, type: 'regular', lngLat: [-80.05, 40.44], lockedTargetId: null };
}

beforeEach(() => {
	courseStore.load(emptyCourse());
	selectionStore.clear();
});

describe('selectionStore', () => {
	it('select is idempotent and toggle flips membership', () => {
		selectionStore.select('cone', 'a');
		selectionStore.select('cone', 'a');
		expect(selectionStore.count).toBe(1);
		selectionStore.toggle('cone', 'a');
		expect(selectionStore.count).toBe(0);
		selectionStore.toggle('cone', 'a');
		expect(selectionStore.isSelected('cone', 'a')).toBe(true);
	});

	it('boxRect normalizes dragging in any direction', () => {
		selectionStore.startBox(10, 20);
		selectionStore.updateBox(2, 5);
		expect(selectionStore.boxRect).toEqual({ x: 2, y: 5, width: 8, height: 15 });
	});

	it('deletes a mixed selection and restores it with a single undo', () => {
		courseStore.addCone(cone('c1'));
		courseStore.addSketch({ id: 's1', points: [[-80.05, 40.44], [-80.051, 40.441]] });
		courseStore.addMeasurement({ p1: [-80.05, 40.44], p2: [-80.051, 40.441], coneId1: null, coneId2: null });
		courseStore.addStagingArea({ id: 'sa1', vertices: [[-80.05, 40.44], [-80.051, 40.44], [-80.051, 40.441]], label: 'Grid' });
		courseStore.addWorkerZone({ id: 'wz1', vertices: [[-80.05, 40.44], [-80.051, 40.44], [-80.051, 40.441]], stationNumber: 1 });
		courseStore.addHazardMarker({ id: 'hz1', type: 'point', coordinates: [[-80.05, 40.44]], bufferFeet: 25 });

		selectionStore.select('cone', 'c1');
		selectionStore.select('sketch', 's1');
		selectionStore.select('measurement', '0');
		selectionStore.select('staging-area', 'sa1');
		selectionStore.select('worker-zone', 'wz1');
		selectionStore.select('hazard', 'hz1');

		selectionStore.deleteSelected();
		expect(courseStore.course.cones).toHaveLength(0);
		expect(courseStore.course.sketches).toHaveLength(0);
		expect(courseStore.course.measurements).toHaveLength(0);
		expect(courseStore.course.stagingAreas).toHaveLength(0);
		expect(courseStore.course.workerZones).toHaveLength(0);
		expect(courseStore.course.hazardMarkers).toHaveLength(0);
		expect(selectionStore.count).toBe(0);

		courseStore.undo();
		expect(courseStore.course.cones).toHaveLength(1);
		expect(courseStore.course.sketches).toHaveLength(1);
		expect(courseStore.course.measurements).toHaveLength(1);
		expect(courseStore.course.stagingAreas).toHaveLength(1);
		expect(courseStore.course.workerZones).toHaveLength(1);
		expect(courseStore.course.hazardMarkers).toHaveLength(1);
		expect(courseStore.canUndo).toBe(false);
	});

	it('deletes measurements and outlines in reverse index order', () => {
		for (let i = 0; i < 3; i++) {
			courseStore.addMeasurement({ p1: [i, i], p2: [i + 1, i], coneId1: null, coneId2: null });
		}
		selectionStore.select('measurement', '0');
		selectionStore.select('measurement', '2');
		selectionStore.deleteSelected();
		expect(courseStore.course.measurements).toHaveLength(1);
		expect(courseStore.course.measurements[0].p1).toEqual([1, 1]);
	});
});
