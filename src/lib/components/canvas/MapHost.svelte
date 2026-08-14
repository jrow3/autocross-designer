<script lang="ts">
	import type mapboxgl from 'mapbox-gl';
	import { onMount } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { ImageMap } from '$lib/engine/imageMap';
	import { createMapboxMap } from '$lib/engine/mapSetup';
	import { initBoxSelection } from '$lib/interactions/boxSelect';
	import { initSketchPan } from '$lib/interactions/sketchPan';
	import { computeCourseBounds } from '$lib/engine/courseBounds';
	import type { CourseData } from '$lib/types/course';

	let {
		onmapevent,
		onready,
		controls = 'editor'
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onmapevent: (kind: 'click' | 'dblclick' | 'mousemove' | 'mousedown' | 'mouseup', e: any) => void;
		onready?: (mode: 'map' | 'image') => void;
		controls?: 'editor' | 'viewer';
	} = $props();

	const BASE_ZOOM = 17;
	let container: HTMLDivElement;
	let boxSelectCleanup: (() => void) | null = null;
	let sketchPanCleanup: (() => void) | null = null;

	function updateMarkerScale() {
		const z = mapStore.zoom;
		const scale = Math.pow(2, z - BASE_ZOOM) * 0.1 * mapStore.markerSize;
		container?.style.setProperty('--marker-scale', String(scale));
	}

	export function initMapMode() {
		const token = import.meta.env.VITE_MAPBOX_TOKEN;
		if (!token) {
			console.error('VITE_MAPBOX_TOKEN not set');
			return;
		}

		const map = createMapboxMap(container, {
			center: courseStore.course.mapCenter,
			zoom: courseStore.course.mapZoom,
			token,
			controls
		});

		map.on('load', () => {
			mapStore.setMap(map);
			mapStore.setZoom(map.getZoom());
			updateMarkerScale();
			if (controls === 'editor') {
				boxSelectCleanup = initBoxSelection(container, () => mapStore.map);
				sketchPanCleanup = initSketchPan(container, () => mapStore.map);
			}
			onready?.('map');
		});

		map.on('zoom', () => {
			mapStore.setZoom(map.getZoom());
			updateMarkerScale();
		});

		if (controls === 'editor') {
			map.on('click', (e: mapboxgl.MapMouseEvent) => onmapevent('click', e));
			map.on('mousemove', (e: mapboxgl.MapMouseEvent) => onmapevent('mousemove', e));
			map.on('dblclick', (e: mapboxgl.MapMouseEvent) => onmapevent('dblclick', e));
			map.on('mousedown', (e: mapboxgl.MapMouseEvent) => onmapevent('mousedown', e));
			map.on('mouseup', (e: mapboxgl.MapMouseEvent) => onmapevent('mouseup', e));

			map.on('moveend', () => {
				const center = map.getCenter();
				courseStore.setMapView([center.lng, center.lat], map.getZoom());
			});
		}
	}

	export function initImageMode(imageSrc: string) {
		const imageMap = new ImageMap(container, imageSrc);

		imageMap.on('load', () => {
			mapStore.setMap(imageMap);
			onready?.('image');
		});

		imageMap.on('zoom', () => {
			mapStore.setZoom(imageMap.getZoom());
			updateMarkerScale();
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		imageMap.on('click', (e: any) => onmapevent('click', e));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		imageMap.on('mousemove', (e: any) => onmapevent('mousemove', e));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		imageMap.on('mousedown', (e: any) => onmapevent('mousedown', e));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		imageMap.on('mouseup', (e: any) => onmapevent('mouseup', e));

		imageMap.on('move', () => {
			const center = imageMap.getCenter();
			courseStore.setMapView([center.lng, center.lat], imageMap.getZoom());
		});
	}

	export function fitBoundsToCourse(data?: CourseData) {
		const map = mapStore.map;
		if (!map || !('fitBounds' in map)) return;
		const bounds = computeCourseBounds(data ?? courseStore.course);
		if (!bounds) return;
		map.fitBounds(bounds, { padding: 0, animate: false });
	}

	$effect(() => {
		const _size = mapStore.markerSize;
		updateMarkerScale();
	});

	$effect(() => {
		const fade = mapStore.mapFade;
		const _map = mapStore.map;
		if (!container) return;
		const canvas = container.querySelector('canvas.mapboxgl-canvas') as HTMLCanvasElement | null;
		if (canvas) {
			if (fade === 0) {
				canvas.style.filter = '';
			} else {
				const sat = 100 - fade;
				const bright = Math.max(20, 100 - fade * 0.8);
				canvas.style.filter = `saturate(${sat}%) brightness(${bright}%)`;
			}
		}
	});

	onMount(() => {
		return () => {
			boxSelectCleanup?.();
			sketchPanCleanup?.();
			mapStore.map?.remove();
		};
	});
</script>

<div class="map-container" bind:this={container}></div>

<style>
	.map-container {
		position: absolute;
		inset: 0;
		--marker-scale: 1;
	}

	.map-container :global(.mapboxgl-canvas-container) {
		cursor: var(--map-cursor, crosshair);
		z-index: 2;
	}

	.map-container :global(.mapboxgl-ctrl-geocoder) {
		background: var(--bg-surface);
		color: var(--text-primary);
		border: 1px solid var(--border);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.map-container :global(.mapboxgl-ctrl-geocoder input) {
		color: var(--text-primary);
	}

	.map-container :global(.mapboxgl-ctrl-geocoder .suggestions) {
		background: var(--bg-surface);
		border-color: var(--border);
	}

	.map-container :global(.mapboxgl-ctrl-geocoder .suggestions > li > a) {
		color: var(--text-secondary);
	}

	.map-container :global(.mapboxgl-ctrl-geocoder .suggestions > .active > a),
	.map-container :global(.mapboxgl-ctrl-geocoder .suggestions > li > a:hover) {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
</style>
