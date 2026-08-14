import type { LngLat } from '$lib/types/course';
import { courseStore } from '$lib/stores/courseStore.svelte';
import { mapStore } from '$lib/stores/mapStore.svelte';
import { toolStore } from '$lib/stores/toolStore.svelte';
import { makeFrame } from '$lib/engine/planarFrame';
import { reflectAcrossAxis, distanceToAxisFeet } from '$lib/engine/mirror';
import { generateId } from '$lib/engine/id';

// Cones this close to the axis are shared between the two ProSolo sides.
const AXIS_SHARED_FT = 2;

export function applyMirror(axis: [LngLat, LngLat]): boolean {
	const feetPerPixel = mapStore.mode === 'image' ? mapStore.feetPerPixel ?? undefined : undefined;
	const frame = makeFrame(axis[0], mapStore.mode, feetPerPixel);
	if (!frame) {
		toolStore.setStatus('Calibrate the image scale before mirroring');
		return false;
	}

	courseStore.pushUndo();
	// re-runs replace the previous mirror set
	for (const cone of courseStore.course.cones.filter((c) => c.mirrorOf)) {
		courseStore.removeCone(cone.id);
	}
	const sources = [...courseStore.course.cones];
	let mirrored = 0;
	for (const cone of sources) {
		if (distanceToAxisFeet(cone.lngLat, axis, frame) < AXIS_SHARED_FT) continue;
		courseStore.addCone({
			...cone,
			id: generateId(),
			lngLat: reflectAcrossAxis(cone.lngLat, axis, frame),
			mirrorOf: cone.id
		});
		mirrored++;
	}
	courseStore.course.prosolo = { axis };
	toolStore.setStatus(`ProSolo: mirrored ${mirrored} cones across the start line`);
	return true;
}

export function reMirror(): void {
	const prosolo = courseStore.course.prosolo;
	if (prosolo) applyMirror(prosolo.axis);
}

export function createMirrorFlow() {
	let firstPoint = $state<LngLat | null>(null);

	return {
		get firstPoint() {
			return firstPoint;
		},
		handleClick(lngLat: LngLat): void {
			if (!firstPoint) {
				firstPoint = lngLat;
				toolStore.setStatus('Click the second point of the shared start line');
				return;
			}
			const axis: [LngLat, LngLat] = [firstPoint, lngLat];
			firstPoint = null;
			// switch tools first — setTool clears the status applyMirror sets
			toolStore.setTool('select');
			applyMirror(axis);
		},
		reset(): void {
			firstPoint = null;
		}
	};
}
