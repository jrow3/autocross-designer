import type mapboxgl from 'mapbox-gl';
import type { MapInstance } from '$lib/stores/mapStore.svelte';

export function initSketchPan(container: HTMLElement, getMap: () => MapInstance | null): () => void {
	const canvasContainer = container.querySelector('.mapboxgl-canvas-container') as HTMLElement | null;
	if (!canvasContainer) return () => {};

	let isPanning = false;
	let panStart: { x: number; y: number } | null = null;

	const onContextMenu = (e: MouseEvent) => e.preventDefault();

	const onMouseDown = (e: MouseEvent) => {
		if (e.button !== 2) return;
		isPanning = true;
		panStart = { x: e.clientX, y: e.clientY };
		canvasContainer.style.cursor = 'grabbing';
	};

	const onMouseMove = (e: MouseEvent) => {
		if (!isPanning || !panStart) return;
		const dx = e.clientX - panStart.x;
		const dy = e.clientY - panStart.y;
		(getMap() as mapboxgl.Map).panBy([-dx, -dy], { duration: 0 });
		panStart = { x: e.clientX, y: e.clientY };
	};

	const onMouseUp = (e: MouseEvent) => {
		if (e.button !== 2) return;
		isPanning = false;
		panStart = null;
		canvasContainer.style.cursor = '';
	};

	canvasContainer.addEventListener('contextmenu', onContextMenu);
	canvasContainer.addEventListener('mousedown', onMouseDown);
	canvasContainer.addEventListener('mousemove', onMouseMove);
	canvasContainer.addEventListener('mouseup', onMouseUp);

	return () => {
		canvasContainer.removeEventListener('contextmenu', onContextMenu);
		canvasContainer.removeEventListener('mousedown', onMouseDown);
		canvasContainer.removeEventListener('mousemove', onMouseMove);
		canvasContainer.removeEventListener('mouseup', onMouseUp);
	};
}
