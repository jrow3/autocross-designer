import type { CourseData, LngLat } from '$lib/types/course';
import type { SelectedItem } from '$lib/stores/selectionStore.svelte';
import { pointInPolygon } from '$lib/engine/polygonEngine';

// Pick thresholds in degrees (squared comparison avoids sqrt)
const HAZARD_PICK_DEG = 0.0003;
const SKETCH_PICK_DEG = 0.00005;

function distSq(a: LngLat, b: LngLat): number {
	const dx = a[0] - b[0];
	const dy = a[1] - b[1];
	return dx * dx + dy * dy;
}

export function pickCourseItem(course: CourseData, lngLat: LngLat): SelectedItem | null {
	for (const area of course.stagingAreas) {
		if (pointInPolygon(lngLat, area.vertices)) return { type: 'staging-area', id: area.id };
	}
	for (const zone of course.workerZones) {
		if (pointInPolygon(lngLat, zone.vertices)) return { type: 'worker-zone', id: zone.id };
	}
	let closestHazardId = '';
	let closestHazardDist = Infinity;
	for (const marker of course.hazardMarkers) {
		for (const coord of marker.coordinates) {
			const d = distSq(coord, lngLat);
			if (d < closestHazardDist) {
				closestHazardDist = d;
				closestHazardId = marker.id;
			}
		}
	}
	if (closestHazardId && closestHazardDist < HAZARD_PICK_DEG * HAZARD_PICK_DEG) {
		return { type: 'hazard', id: closestHazardId };
	}
	for (const sketch of course.sketches) {
		for (const pt of sketch.points) {
			if (distSq(pt, lngLat) < SKETCH_PICK_DEG * SKETCH_PICK_DEG) {
				return { type: 'sketch', id: sketch.id };
			}
		}
	}
	return null;
}

export interface BoxRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type ProjectFn = (lngLat: LngLat) => { x: number; y: number };

export function itemsInBox(course: CourseData, rect: BoxRect, project: ProjectFn): SelectedItem[] {
	const inBox = (lngLat: LngLat): boolean => {
		const pt = project(lngLat);
		return pt.x >= rect.x && pt.x <= rect.x + rect.width && pt.y >= rect.y && pt.y <= rect.y + rect.height;
	};

	const items: SelectedItem[] = [];
	for (const cone of course.cones) {
		if (inBox(cone.lngLat)) items.push({ type: 'cone', id: cone.id });
	}
	for (const worker of course.workers) {
		if (inBox(worker.lngLat)) items.push({ type: 'worker', id: worker.id });
	}
	course.measurements.forEach((m, i) => {
		if (inBox(m.p1) || inBox(m.p2)) items.push({ type: 'measurement', id: String(i) });
	});
	course.courseOutline.forEach((seg, i) => {
		if (inBox(seg.p1) || inBox(seg.p2)) items.push({ type: 'outline', id: String(i) });
	});
	for (const hazard of course.hazardMarkers) {
		if (hazard.coordinates.some(inBox)) items.push({ type: 'hazard', id: hazard.id });
	}
	for (const area of course.stagingAreas) {
		if (area.vertices.some(inBox)) items.push({ type: 'staging-area', id: area.id });
	}
	for (const zone of course.workerZones) {
		if (zone.vertices.some(inBox)) items.push({ type: 'worker-zone', id: zone.id });
	}
	for (const sketch of course.sketches) {
		if (sketch.points.some(inBox)) items.push({ type: 'sketch', id: sketch.id });
	}
	return items;
}
