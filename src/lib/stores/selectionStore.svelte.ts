import { courseStore } from './courseStore.svelte';
import { mapStore } from './mapStore.svelte';
import { generateId } from '$lib/engine/id';
import { feetToLngLatOffset, feetToPixelOffset } from '$lib/engine/geo';
import type { LngLat } from '$lib/types/course';

export type SelectableType = 'cone' | 'worker' | 'note' | 'measurement' | 'outline' | 'hazard' | 'barrier' | 'staging-area' | 'worker-zone' | 'sketch';

export interface SelectedItem {
	type: SelectableType;
	id: string;
}

let selected = $state<SelectedItem[]>([]);
let boxActive = $state(false);
let boxStart = $state({ x: 0, y: 0 });
let boxEnd = $state({ x: 0, y: 0 });

export const selectionStore = {
	get selected() {
		return selected;
	},

	get count() {
		return selected.length;
	},

	get boxActive() {
		return boxActive;
	},

	get boxRect() {
		const x1 = Math.min(boxStart.x, boxEnd.x);
		const y1 = Math.min(boxStart.y, boxEnd.y);
		const x2 = Math.max(boxStart.x, boxEnd.x);
		const y2 = Math.max(boxStart.y, boxEnd.y);
		return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
	},

	isSelected(type: SelectableType, id: string): boolean {
		return selected.some((s) => s.type === type && s.id === id);
	},

	select(type: SelectableType, id: string): void {
		if (!this.isSelected(type, id)) {
			selected.push({ type, id });
		}
	},

	toggle(type: SelectableType, id: string): void {
		const idx = selected.findIndex((s) => s.type === type && s.id === id);
		if (idx !== -1) {
			selected.splice(idx, 1);
		} else {
			selected.push({ type, id });
		}
	},

	clear(): void {
		selected.length = 0;
	},

	selectAll(): void {
		selected.length = 0;
		for (const c of courseStore.course.cones) {
			selected.push({ type: 'cone', id: c.id });
		}
		for (const w of courseStore.course.workers) {
			selected.push({ type: 'worker', id: w.id });
		}
		for (const n of courseStore.course.notes) {
			selected.push({ type: 'note', id: n.id });
		}
		courseStore.course.measurements.forEach((_, i) => {
			selected.push({ type: 'measurement', id: String(i) });
		});
		courseStore.course.courseOutline.forEach((_, i) => {
			selected.push({ type: 'outline', id: String(i) });
		});
	},

	deleteSelected(): void {
		if (selected.length === 0) return;
		courseStore.pushUndo();
		// Delete in reverse index order for measurements/outlines to avoid index shifting
		const measurements = selected.filter(s => s.type === 'measurement').map(s => parseInt(s.id)).sort((a, b) => b - a);
		const outlines = selected.filter(s => s.type === 'outline').map(s => parseInt(s.id)).sort((a, b) => b - a);
		for (const item of selected) {
			switch (item.type) {
				case 'cone':
					courseStore.removeCone(item.id);
					break;
				case 'worker':
					courseStore.removeWorker(item.id);
					break;
				case 'note':
					courseStore.removeNote(item.id);
					break;
				case 'hazard':
					courseStore.removeHazardMarker(item.id);
					break;
				case 'barrier':
					courseStore.removeBarrier(item.id);
					break;
				case 'staging-area':
					courseStore.removeStagingArea(item.id);
					break;
				case 'worker-zone':
					courseStore.removeWorkerZone(item.id);
					break;
				case 'sketch':
					courseStore.removeSketch(item.id);
					break;
			}
		}
		for (const idx of measurements) {
			courseStore.removeMeasurement(idx);
		}
		for (const idx of outlines) {
			courseStore.removeOutlineSegment(idx);
		}
		selected.length = 0;
	},

	// Clone selected cones and workers 10 ft to the south-east; selection moves
	// to the clones so a second Ctrl+D keeps stepping.
	duplicateSelected(): void {
		const items = selected.filter((s) => s.type === 'cone' || s.type === 'worker');
		if (items.length === 0) return;
		courseStore.pushUndo();

		const offset = (p: LngLat): LngLat =>
			mapStore.mode === 'image'
				? feetToPixelOffset(p, 135, 10, mapStore.feetPerPixel ?? 1)
				: feetToLngLatOffset(p, 135, 10);

		const clones: SelectedItem[] = [];
		for (const item of items) {
			if (item.type === 'cone') {
				const cone = courseStore.course.cones.find((c) => c.id === item.id);
				if (!cone) continue;
				const id = generateId();
				courseStore.addCone({ ...cone, id, lngLat: offset(cone.lngLat), mirrorOf: undefined });
				clones.push({ type: 'cone', id });
			} else {
				const worker = courseStore.course.workers.find((w) => w.id === item.id);
				if (!worker) continue;
				const id = generateId();
				courseStore.addWorker({
					...worker,
					id,
					number: courseStore.course.workers.length + 1,
					lngLat: offset(worker.lngLat)
				});
				clones.push({ type: 'worker', id });
			}
		}
		selected.length = 0;
		selected.push(...clones);
	},

	startBox(x: number, y: number): void {
		boxActive = true;
		boxStart = { x, y };
		boxEnd = { x, y };
	},

	updateBox(x: number, y: number): void {
		boxEnd = { x, y };
	},

	endBox(): void {
		boxActive = false;
	}
};
