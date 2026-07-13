import type mapboxgl from 'mapbox-gl';
import type { LngLat } from '$lib/types/course';
import type { MapInstance } from '$lib/stores/mapStore.svelte';
import { toolStore } from '$lib/stores/toolStore.svelte';
import { courseStore } from '$lib/stores/courseStore.svelte';
import { selectionStore } from '$lib/stores/selectionStore.svelte';
import { pickCourseItem, itemsInBox } from './hitTest';

const INTERACTIVE_SELECTOR =
	'.cone-marker,.worker-marker,.obstacle-marker,.note-marker,.measurement-endpoint,.outline-endpoint,.outline-control,.resize-handle,.rotate-handle,.mapboxgl-ctrl,.mapboxgl-marker';

const CLICK_TOLERANCE_PX = 5;

export function initBoxSelection(container: HTMLElement, getMap: () => MapInstance | null): () => void {
	let isBoxSelecting = false;

	function finishBox(map: MapInstance) {
		const rect = selectionStore.boxRect;
		const mapEl = map as mapboxgl.Map;
		const containerRect = container.getBoundingClientRect();

		if (rect.width < CLICK_TOLERANCE_PX && rect.height < CLICK_TOLERANCE_PX) {
			// Single click, not a drag — try selecting zones/hazards/sketches
			const clickPt = mapEl.unproject([rect.x - containerRect.left, rect.y - containerRect.top]);
			const hit = pickCourseItem(courseStore.course, [clickPt.lng, clickPt.lat]);
			selectionStore.clear();
			if (hit) selectionStore.select(hit.type, hit.id);
			return;
		}

		selectionStore.clear();
		const project = (lngLat: LngLat) => {
			const pt = mapEl.project(lngLat);
			return { x: pt.x + containerRect.left, y: pt.y + containerRect.top };
		};
		for (const item of itemsInBox(courseStore.course, rect, project)) {
			selectionStore.select(item.type, item.id);
		}
	}

	function onMouseDown(e: MouseEvent) {
		if (toolStore.activeTool !== 'select' || e.button !== 0) return;
		const target = e.target as HTMLElement;
		if (target.closest(INTERACTIVE_SELECTOR)) return;

		e.preventDefault();
		isBoxSelecting = true;
		selectionStore.startBox(e.clientX, e.clientY);

		const map = getMap();
		if (map && 'dragPan' in map) map.dragPan.disable();

		const onMove = (ev: MouseEvent) => {
			if (!isBoxSelecting) return;
			selectionStore.updateBox(ev.clientX, ev.clientY);
		};

		const onUp = () => {
			if (!isBoxSelecting) return;
			isBoxSelecting = false;
			selectionStore.endBox();
			if (map && 'dragPan' in map) map.dragPan.enable();
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
			if (map) finishBox(map);
		};

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}

	container.addEventListener('mousedown', onMouseDown);
	return () => container.removeEventListener('mousedown', onMouseDown);
}
