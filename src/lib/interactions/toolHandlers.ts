import type { Tool } from '$lib/stores/toolStore.svelte';
import type { ConeData, ConeType, LngLat } from '$lib/types/course';
import type { PolygonOverlayApi, ToolHandler } from './toolRouter';
import { courseStore } from '$lib/stores/courseStore.svelte';
import { toolStore } from '$lib/stores/toolStore.svelte';
import { mapStore } from '$lib/stores/mapStore.svelte';
import { selectionStore } from '$lib/stores/selectionStore.svelte';
import { offsetPointerPosition } from '$lib/engine/coneLogic';
import { generateId } from '$lib/engine/id';
import { pickCourseItem } from './hitTest';

function placeCone(type: ConeType, lngLat: LngLat, extra: Partial<ConeData> = {}): void {
	courseStore.pushUndo();
	courseStore.addCone({ id: generateId(), type, lngLat, lockedTargetId: null, ...extra });
}

// Close the polygon when the click lands within 20px of its first vertex.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryClosePolygon(overlay: PolygonOverlayApi | undefined, e: any): boolean {
	if (!overlay) return false;
	const firstVertex = overlay.getFirstVertex();
	if (!firstVertex) return false;
	const map = mapStore.map;
	if (!map || !e.point) return false;
	const firstPx = map.project(firstVertex as [number, number]);
	const dx = firstPx.x - e.point.x;
	const dy = firstPx.y - e.point.y;
	return dx * dx + dy * dy < 20 * 20 ? (overlay.close(), true) : false;
}

export const TOOL_HANDLERS: Record<Tool, ToolHandler> = {
	regular: { onClick: ({ lngLat }) => placeCone('regular', lngLat) },
	'start-cone': { onClick: ({ lngLat }) => placeCone('start-cone', lngLat) },
	'finish-cone': { onClick: ({ lngLat }) => placeCone('finish-cone', lngLat) },

	trailer: { onClick: ({ lngLat }) => placeCone('trailer', lngLat, { width: 80, height: 40, rotation: 0 }) },

	pointer: {
		onClick: ({ lngLat }) => {
			const feetPerPixel = mapStore.mode === 'image' && mapStore.map && 'getScale' in mapStore.map
				? mapStore.map.getScale()
				: undefined;
			const pointerPos = offsetPointerPosition(lngLat, courseStore.course.cones, mapStore.mode, feetPerPixel);
			placeCone('pointer', pointerPos);
		}
	},

	gate: { onClick: ({ lngLat, flows }) => flows.gate.handleClick(lngLat) },
	slalom: { onClick: ({ lngLat, flows }) => flows.slalom.handleClick(lngLat) },
	scale: { onClick: ({ lngLat, flows }) => flows.scale.handleClick(lngLat) },
	'hazard-line': { onClick: ({ lngLat, flows }) => flows.hazardLine.handleClick(lngLat) },
	barrier: { onClick: ({ lngLat, flows }) => flows.barrier.handleClick(lngLat) },
	lying: { onClick: ({ lngLat }) => placeCone('lying', lngLat) },

	worker: {
		onClick: ({ lngLat }) => {
			courseStore.pushUndo();
			courseStore.addWorker({
				id: generateId(),
				number: courseStore.course.workers.length + 1,
				lngLat
			});
		}
	},

	drivingline: {
		onClick: ({ lngLat }) => {
			courseStore.pushUndo();
			courseStore.addWaypoint({ lngLat });
		}
	},

	measure: { onClick: ({ lngLat, overlays }) => overlays.measurement?.handleClick(lngLat) },
	courseoutline: { onClick: ({ lngLat, overlays }) => overlays.outline?.handleClick(lngLat) },

	note: { onClick: ({ lngLat, ui }) => ui.openNoteDialog(lngLat) },

	// Sketch draws through its own map mousedown/move/up listeners.
	sketch: {},

	'staging-area': {
		onClick: (ctx) => {
			if (tryClosePolygon(ctx.overlays.stagingPolygon, ctx.event)) return;
			ctx.overlays.stagingPolygon?.handleClick(ctx.event);
		},
		onDblClick: (ctx) => ctx.overlays.stagingPolygon?.handleDoubleClick(ctx.event)
	},

	'worker-zone': {
		onClick: (ctx) => {
			if (tryClosePolygon(ctx.overlays.workerZonePolygon, ctx.event)) return;
			ctx.overlays.workerZonePolygon?.handleClick(ctx.event);
		},
		onDblClick: (ctx) => ctx.overlays.workerZonePolygon?.handleDoubleClick(ctx.event)
	},

	'hazard-point': {
		onClick: ({ lngLat }) => {
			courseStore.pushUndo();
			courseStore.addHazardMarker({
				id: generateId(),
				type: 'point',
				coordinates: [lngLat],
				bufferFeet: toolStore.hazardBufferFeet
			});
		}
	},

	select: {
		onClick: ({ lngLat }) => {
			const hit = pickCourseItem(courseStore.course, lngLat);
			selectionStore.clear();
			if (hit) selectionStore.select(hit.type, hit.id);
		}
	}
};
