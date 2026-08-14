<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import type { CourseData } from '$lib/types/course';
	import MapHost from './MapHost.svelte';
	import ConeMarker from '../ConeMarker.svelte';
	import WorkerMarker from '../WorkerMarker.svelte';
	import NoteMarker from '../NoteMarker.svelte';
	import DrivingLine from '../DrivingLine.svelte';
	import SpeedLineOverlay from './SpeedLineOverlay.svelte';
	import MeasurementOverlay from '../MeasurementOverlay.svelte';
	import OutlineOverlay from '../OutlineOverlay.svelte';
	import StagingOverlay from '../StagingOverlay.svelte';
	import WorkerZoneOverlay from '../WorkerZoneOverlay.svelte';
	import HazardOverlay from '../HazardOverlay.svelte';

	let {
		readonly = false,
		controls = 'editor',
		onmapevent,
		onready,
		children
	}: {
		readonly?: boolean;
		controls?: 'editor' | 'viewer';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onmapevent?: (kind: 'click' | 'dblclick' | 'mousemove' | 'mousedown' | 'mouseup', e: any) => void;
		onready?: (mode: 'map' | 'image') => void;
		children?: Snippet;
	} = $props();

	let mapHost = $state<MapHost>();
	let measurementOverlay = $state<MeasurementOverlay>();
	let outlineOverlay = $state<OutlineOverlay>();

	export function getMeasurementOverlay() {
		return measurementOverlay;
	}

	export function getOutlineOverlay() {
		return outlineOverlay;
	}

	export function initMapMode() {
		mapHost?.initMapMode();
	}

	export function initImageMode(imageSrc: string) {
		mapHost?.initImageMode(imageSrc);
	}

	export function fitBoundsToCourse(data?: CourseData) {
		mapHost?.fitBoundsToCourse(data);
	}
</script>

<MapHost bind:this={mapHost} {controls} onmapevent={onmapevent ?? (() => {})} {onready} />

{#if mapStore.map}
	{#if layerStore.isVisible('cones')}
		{#each courseStore.course.cones as cone (cone.id)}
			<ConeMarker {cone} {readonly} />
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
	{#if layerStore.isVisible('speedLine')}
		<SpeedLineOverlay />
	{/if}
	{#if layerStore.isVisible('measurements')}
		<MeasurementOverlay bind:this={measurementOverlay} />
	{/if}
	{#if layerStore.isVisible('courseOutline')}
		<OutlineOverlay bind:this={outlineOverlay} />
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
	{@render children?.()}
{/if}
