<script lang="ts">
	import { createMarker, wrapForMapbox, type AnyMarker } from '$lib/engine/markerFactory';
	import { onMount, untrack } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { catmullRomSpline } from '$lib/engine/catmullRom';
	import type { LngLat } from '$lib/types/course';

	// The line is an SVG overlay repositioned from map.project() — GeoJSON line
	// layers never render on ImageMap, and this also updates live as waypoints land.
	let container: HTMLDivElement;
	let svgEl: SVGSVGElement | null = null;
	let pathEl: SVGPathElement | null = null;
	let markers: AnyMarker[] = [];

	function renderPath() {
		const map = mapStore.map;
		if (!map) return;
		const coords = courseStore.course.drivingLine.map((wp) => wp.lngLat);
		if (coords.length < 2) {
			pathEl?.setAttribute('d', '');
			return;
		}
		if (!svgEl) {
			svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
			svgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';
			pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			pathEl.setAttribute('fill', 'none');
			pathEl.setAttribute('stroke', 'var(--driving-line)');
			pathEl.setAttribute('stroke-width', '3');
			pathEl.setAttribute('stroke-dasharray', '6 5');
			pathEl.setAttribute('stroke-linecap', 'round');
			svgEl.appendChild(pathEl);
			container.appendChild(svgEl);
		}
		const smoothed = catmullRomSpline(coords, 20);
		const d = smoothed
			.map((p, i) => {
				const px = map.project(p as [number, number]);
				return `${i === 0 ? 'M' : 'L'}${px.x.toFixed(1)} ${px.y.toFixed(1)}`;
			})
			.join(' ');
		pathEl!.setAttribute('d', d);
	}

	function createWaypointMarker(index: number, lngLat: LngLat): AnyMarker {
		const map = mapStore.map!;
		const el = document.createElement('div');
		el.className = 'waypoint-marker';
		const wrapper = wrapForMapbox(mapStore.mode, el);

		const marker = createMarker(mapStore.mode, { element: wrapper, draggable: true })
			.setLngLat(lngLat as [number, number])
			.addTo(map);

		marker.on('dragstart', () => {
			courseStore.pushUndo();
		});

		marker.on('drag', () => {
			const pos = marker.getLngLat();
			courseStore.updateWaypointPosition(index, [pos.lng, pos.lat]);
			renderPath();
		});

		marker.on('dragend', () => {
			const pos = marker.getLngLat();
			courseStore.updateWaypointPosition(index, [pos.lng, pos.lat]);
			renderPath();
		});

		el.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			courseStore.pushUndo();
			courseStore.removeWaypoint(index);
			rebuildMarkers();
			renderPath();
		});

		return marker;
	}

	function rebuildMarkers() {
		const map = mapStore.map;
		if (!map) return;

		for (const m of markers) m.remove();
		markers = [];

		courseStore.course.drivingLine.forEach((wp, i) => {
			markers.push(createWaypointMarker(i, wp.lngLat));
		});
	}

	onMount(() => {
		const map = mapStore.map;
		if (!map) return;

		map.on('move', renderPath);
		map.on('zoom', renderPath);
		rebuildMarkers();
		renderPath();

		return () => {
			map.off('move', renderPath);
			map.off('zoom', renderPath);
			for (const m of markers) m.remove();
			svgEl?.remove();
		};
	});

	$effect(() => {
		const _waypoints = courseStore.course.drivingLine.length;
		untrack(() => {
			rebuildMarkers();
			renderPath();
		});
	});
</script>

<div class="driving-line-container" bind:this={container}></div>

<style>
	.driving-line-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 5;
	}

	:global(.waypoint-marker) {
		width: 12px;
		height: 12px;
		background: var(--driving-line);
		border: 2px solid #fff;
		border-radius: 50%;
		cursor: pointer;
		transform: scale(var(--marker-scale, 1));
	}
</style>
