<script lang="ts">
	import mapboxgl from 'mapbox-gl';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { saveLocal } from '$lib/services/courseService';
	import { setEditCopyHandoff, setFitCourseOnLoad, setSkipBanner } from '$lib/services/handoff';
	import Copy from '@lucide/svelte/icons/copy';
	import Button from './ui/Button.svelte';
	import ConeMarker from './ConeMarker.svelte';
	import WorkerMarker from './WorkerMarker.svelte';
	import NoteMarker from './NoteMarker.svelte';
	import DrivingLine from './DrivingLine.svelte';
	import MeasurementOverlay from './MeasurementOverlay.svelte';
	import OutlineOverlay from './OutlineOverlay.svelte';
	import StagingOverlay from './StagingOverlay.svelte';
	import WorkerZoneOverlay from './WorkerZoneOverlay.svelte';
	import HazardOverlay from './HazardOverlay.svelte';

	let { title }: { title: string } = $props();

	let container: HTMLDivElement;

	const toggleableLayers = [
		{ key: 'cones' as const, label: 'Cones' },
		{ key: 'workers' as const, label: 'Workers' },
		{ key: 'notes' as const, label: 'Notes' },
		{ key: 'drivingLine' as const, label: 'Driving Line' },
		{ key: 'measurements' as const, label: 'Measurements' },
		{ key: 'courseOutline' as const, label: 'Course Outline' },
		{ key: 'stagingAreas' as const, label: 'Staging Areas' },
		{ key: 'workerZones' as const, label: 'Worker Zones' },
		{ key: 'hazardMarkers' as const, label: 'Safety Zones' }
	];

	function editCopy() {
		setEditCopyHandoff(courseStore.course);
		setFitCourseOnLoad();
		setSkipBanner();
		window.location.href = '/';
	}

	onMount(() => {
		const token = import.meta.env.VITE_MAPBOX_TOKEN;
		mapboxgl.accessToken = token;
		mapboxgl.workerUrl = '/mapbox-gl-csp-worker.js';

		const map = new mapboxgl.Map({
			container,
			style: 'mapbox://styles/mapbox/satellite-streets-v12',
			center: courseStore.course.mapCenter as [number, number],
			zoom: courseStore.course.mapZoom,
			minZoom: 10,
			maxZoom: 22,
			preserveDrawingBuffer: true,
			dragRotate: false,
			pitchWithRotate: false,
			touchPitch: false
		});

		map.addControl(new mapboxgl.NavigationControl(), 'top-left');

		const BASE_ZOOM = 17;

		function updateScale() {
			const z = map.getZoom();
			const scale = Math.pow(2, z - BASE_ZOOM) * 0.1 * mapStore.markerSize;
			container?.style.setProperty('--marker-scale', String(scale));
		}

		map.on('load', () => {
			mapStore.setMap(map);
			mapStore.setMode('map');
			mapStore.setZoom(map.getZoom());
			updateScale();
			layerStore.setVisible('sketches', false);
		});

		map.on('zoom', () => {
			mapStore.setZoom(map.getZoom());
			updateScale();
		});

		return () => {
			map?.remove();
		};
	});
</script>

<div class="viewer">
	<div class="map-container" bind:this={container}></div>

	<div class="course-title">{title}</div>

	<div class="layer-toggles" role="group" aria-label="Map layers">
		<span class="layers-heading">Layers</span>
		{#each toggleableLayers as layer}
			<label class="layer-toggle">
				<input
					type="checkbox"
					checked={layerStore.isVisible(layer.key)}
					onchange={() => layerStore.toggle(layer.key)}
				/>
				<span>{layer.label}</span>
			</label>
		{/each}
	</div>

	<div class="edit-copy">
		<Button variant="primary" onclick={editCopy} title="Open this course in the editor as your own copy">
			<Copy size={14} />
			Edit a Copy
		</Button>
	</div>

	{#if mapStore.map}
		{#if layerStore.isVisible('cones')}
			{#each courseStore.course.cones as cone (cone.id)}
				<ConeMarker {cone} readonly={true} />
			{/each}
		{/if}
		{#if layerStore.isVisible('workers')}
			{#each courseStore.course.workers as worker (worker.id)}
				<WorkerMarker {worker} />
			{/each}
		{/if}
		{#if layerStore.isVisible('notes')}
			{#each courseStore.course.notes as note (note.id)}
				<NoteMarker {note} />
			{/each}
		{/if}
		{#if layerStore.isVisible('drivingLine')}
			<DrivingLine />
		{/if}
		{#if layerStore.isVisible('measurements')}
			<MeasurementOverlay />
		{/if}
		{#if layerStore.isVisible('courseOutline')}
			<OutlineOverlay />
		{/if}
		{#if layerStore.isVisible('stagingAreas')}
			<StagingOverlay />
		{/if}
		{#if layerStore.isVisible('workerZones')}
			<WorkerZoneOverlay />
		{/if}
		{#if layerStore.isVisible('hazardMarkers')}
			<HazardOverlay />
		{/if}
	{/if}
</div>

<style>
	.viewer {
		width: 100%;
		height: 100vh;
		position: relative;
	}

	.map-container {
		width: 100%;
		height: 100%;
		--marker-scale: 1;
	}

	.course-title {
		position: absolute;
		top: var(--space-3);
		left: 50px;
		background: var(--bg-overlay);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-size: var(--text-base);
		font-weight: 600;
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		box-shadow: var(--shadow-md);
		z-index: var(--z-map-ui);
	}

	.layer-toggles {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		background: var(--bg-overlay);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: var(--space-3);
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		z-index: var(--z-map-ui);
	}

	.layers-heading {
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: var(--space-1);
	}

	.layer-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		cursor: pointer;
	}

	.layer-toggle input {
		width: 14px;
		height: 14px;
		accent-color: var(--accent);
	}

	.edit-copy {
		position: absolute;
		bottom: var(--space-5);
		right: var(--space-5);
		z-index: var(--z-map-ui);
	}
</style>
