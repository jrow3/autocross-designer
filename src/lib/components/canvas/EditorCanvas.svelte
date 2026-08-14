<script lang="ts">
	import { onMount } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { selectionStore } from '$lib/stores/selectionStore.svelte';
	import { createGateFlow, createSlalomFlow, createScaleFlow, createHazardLineFlow } from '$lib/interactions/placementFlows.svelte';
	import { dispatchClick, dispatchDblClick, type ToolCtx } from '$lib/interactions/toolRouter';
	import { registerCanvasKeys } from '$lib/interactions/keyScope';
	import { generateId } from '$lib/engine/id';
	import { autosave, loadAutosave } from '$lib/services/courseService';
	import { consumeEditCopyHandoff, consumeFitCourseOnLoad, consumeSkipBanner, hasSkipBanner, peekEditCopyHandoff } from '$lib/services/handoff';
	import { deserialize } from '$lib/engine/courseSerializer';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { STAGING_COLOR, WORKER_ZONE_COLOR } from '$lib/config/palette';
	import type { CourseData, LngLat } from '$lib/types/course';
	import CourseCanvas from './CourseCanvas.svelte';
	import GhostPreview from './GhostPreview.svelte';
	import NoteDialog from '../NoteDialog.svelte';
	import SlalomDialog from '../SlalomDialog.svelte';
	import GridOverlay from '../GridOverlay.svelte';
	import SketchOverlay from '../SketchOverlay.svelte';
	import PolygonOverlay from '../PolygonOverlay.svelte';
	import ConeNumberOverlay from '../ConeNumberOverlay.svelte';
	import ModeBanner from '../ModeBanner.svelte';
	import ScaleDialog from '../ScaleDialog.svelte';

	let courseCanvas = $state<CourseCanvas>();

	// Mode selection — skip banner if coming from shared link "Edit a Copy"
	let fromSharedLink = hasSkipBanner();
	let showBanner = $state(!fromSharedLink);
	let reloadPrompt = $state<{ fileName?: string } | null>(null);

	// Multi-click tool flows
	const gateFlow = createGateFlow();
	const slalomFlow = createSlalomFlow();
	const scaleFlow = createScaleFlow();
	const hazardLineFlow = createHazardLineFlow();

	let pendingNoteLngLat: LngLat | null = $state(null);
	let mousePos: LngLat | null = $state(null);
	let nextNoteNumber = $state(1);

	let gridOverlay = $state<GridOverlay>();
	let sketchOverlay = $state<SketchOverlay>();
	let stagingPolygonOverlay = $state<PolygonOverlay>();
	let workerZonePolygonOverlay = $state<PolygonOverlay>();

	function buildCtx(lngLat: LngLat, event: unknown): ToolCtx {
		return {
			lngLat,
			event,
			overlays: {
				measurement: courseCanvas?.getMeasurementOverlay(),
				outline: courseCanvas?.getOutlineOverlay(),
				stagingPolygon: stagingPolygonOverlay,
				workerZonePolygon: workerZonePolygonOverlay
			},
			flows: { gate: gateFlow, slalom: slalomFlow, scale: scaleFlow, hazardLine: hazardLineFlow },
			ui: { openNoteDialog: (l) => (pendingNoteLngLat = l) }
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleMapEvent(kind: 'click' | 'dblclick' | 'mousemove' | 'mousedown' | 'mouseup', e: any) {
		switch (kind) {
			case 'click':
				dispatchClick(toolStore.activeTool, buildCtx([e.lngLat.lng, e.lngLat.lat], e));
				sketchOverlay?.handleClick(e);
				break;
			case 'dblclick':
				dispatchDblClick(toolStore.activeTool, buildCtx([e.lngLat.lng, e.lngLat.lat], e));
				break;
			case 'mousemove':
				mousePos = [e.lngLat.lng, e.lngLat.lat];
				stagingPolygonOverlay?.handleMouseMove(e);
				workerZonePolygonOverlay?.handleMouseMove(e);
				sketchOverlay?.handleMouseMove(e);
				break;
			case 'mousedown':
				sketchOverlay?.handleMouseDown(e);
				break;
			case 'mouseup':
				sketchOverlay?.handleMouseUp();
				break;
		}
	}

	function handleNoteConfirm(text: string) {
		if (!pendingNoteLngLat) return;
		courseStore.pushUndo();
		courseStore.addNote({
			id: generateId(),
			number: nextNoteNumber++,
			text,
			lngLat: pendingNoteLngLat
		});
		pendingNoteLngLat = null;
	}

	function handleModeSelect(mode: 'map' | 'image', imageSrc?: string, fileName?: string) {
		// Load course data: from Edit a Copy sessionStorage, or from autosave
		const editCopy = consumeEditCopyHandoff();
		if (editCopy) {
			courseStore.load(deserialize(editCopy));
		} else if (!fromSharedLink) {
			const saved = loadAutosave();
			if (saved) {
				courseStore.load(deserialize(saved));
			}
		}
		fromSharedLink = false;
		showBanner = false;
		reloadPrompt = null;
		mapStore.setMode(mode);

		// Stamp image metadata so saved/shared courses can be reopened in the right mode.
		courseStore.course.imageMode = mode === 'image';
		courseStore.course.imageFileName = mode === 'image' ? fileName : undefined;

		if (mode === 'image' && imageSrc) {
			courseCanvas?.initImageMode(imageSrc);
		} else {
			courseCanvas?.initMapMode();
		}
	}

	function handleMapReady(mode: 'map' | 'image') {
		if (mode === 'map') {
			if (consumeFitCourseOnLoad()) {
				setTimeout(() => courseCanvas?.fitBoundsToCourse(), 100);
			}
			return;
		}
		// Start-in-venue invariant: this banner flow runs while modeStore.activeMode is still
		// 'venue' (deliberately never persisted), and 'venue' is scale's home mode.
		const savedScale = courseStore.course.imageScale;
		const map = mapStore.map;
		if (savedScale && map && 'setScale' in map) {
			map.setScale(savedScale);
			mapStore.setFeetPerPixel(savedScale);
			toolStore.setStatus(`Scale: ${savedScale.toFixed(4)} ft/px`);
		} else {
			mapStore.setFeetPerPixel(null);
			toolStore.setTool('scale');
			toolStore.setStatus('Calibrate: click two points with a known distance');
		}
	}

	// Canvas-scoped keys, consulted by the global handler in +layout.svelte.
	// Always returns false: the global shortcuts (Escape → select, Delete →
	// delete selection) intentionally still run afterwards.
	function handleCanvasKeys(e: KeyboardEvent): boolean {
		if (e.key === 'Delete' || e.key === 'Backspace') {
			sketchOverlay?.deleteSelected();
		}
		if (e.key === 'Enter') {
			if (toolStore.activeTool === 'staging-area') stagingPolygonOverlay?.close();
			if (toolStore.activeTool === 'worker-zone') workerZonePolygonOverlay?.close();
		}
		if (e.key === 'Escape') {
			if (toolStore.activeTool === 'staging-area') stagingPolygonOverlay?.cancel();
			if (toolStore.activeTool === 'worker-zone') workerZonePolygonOverlay?.cancel();
		}
		return false;
	}

	$effect(() => {
		const _tool = toolStore.activeTool;
		gateFlow.reset();
		slalomFlow.reset();
		scaleFlow.reset();
		courseCanvas?.getMeasurementOverlay()?.cancelPending();
		courseCanvas?.getOutlineOverlay()?.cancelPending();
		if (toolStore.activeTool !== 'hazard-line') {
			hazardLineFlow.reset();
		}
	});

	// Autosave on course changes
	$effect(() => {
		const _cones = courseStore.course.cones.length;
		const _workers = courseStore.course.workers.length;
		const _notes = courseStore.course.notes.length;
		const _waypoints = courseStore.course.drivingLine.length;
		autosave(courseStore.course);
	});

	export function fitBoundsToCourse(data?: CourseData) {
		courseCanvas?.fitBoundsToCourse(data);
	}

	onMount(() => {
		const unregisterKeys = registerCanvasKeys(handleCanvasKeys);
		if (consumeSkipBanner()) {
			const peek = peekEditCopyHandoff();
			if (peek?.imageMode) {
				// Image bitmaps are never persisted — ask for the venue image again,
				// then handleModeSelect('image', ...) restores the course onto it.
				reloadPrompt = { fileName: peek.imageFileName };
				showBanner = true;
			} else {
				handleModeSelect('map');
			}
		}
		return () => unregisterKeys();
	});
</script>

<div class="map-outer" style="--map-cursor: {TOOL_DEFS.find((d) => d.tool === toolStore.activeTool)?.cursor ?? 'crosshair'}">
	<CourseCanvas bind:this={courseCanvas} onmapevent={handleMapEvent} onready={handleMapReady}>
		<GridOverlay bind:this={gridOverlay} />
		{#if layerStore.isVisible('sketches')}
			<SketchOverlay bind:this={sketchOverlay} />
		{/if}
		{#if layerStore.isVisible('coneNumbers')}
			<ConeNumberOverlay />
		{/if}
		<PolygonOverlay
			bind:this={stagingPolygonOverlay}
			activeTools={['staging-area']}
			fillColor={STAGING_COLOR}
			fillOpacity={0.2}
			strokeColor={STAGING_COLOR}
			onComplete={(vertices) => {
				courseStore.pushUndo();
				courseStore.addStagingArea({
					id: generateId(),
					vertices,
					label: 'STAGING'
				});
			}}
		/>
		<PolygonOverlay
			bind:this={workerZonePolygonOverlay}
			activeTools={['worker-zone']}
			fillColor={WORKER_ZONE_COLOR}
			fillOpacity={0.1}
			strokeColor={WORKER_ZONE_COLOR}
			strokeDasharray={[6, 3]}
			onComplete={(vertices) => {
				const nextStation = Math.max(0, ...courseStore.course.workerZones.map((z) => z.stationNumber)) + 1;
				courseStore.pushUndo();
				courseStore.addWorkerZone({
					id: generateId(),
					vertices,
					stationNumber: nextStation
				});
			}}
		/>
	</CourseCanvas>

	{#if showBanner}
		<ModeBanner onselect={handleModeSelect} {reloadPrompt} />
	{/if}
</div>

<GhostPreview {gateFlow} {slalomFlow} {mousePos} />

{#if slalomFlow.showDialog && slalomFlow.start && slalomFlow.end}
	<SlalomDialog
		start={slalomFlow.start}
		end={slalomFlow.end}
		onconfirm={(count, spacing) => slalomFlow.confirm(count, spacing)}
		oncancel={() => slalomFlow.cancel()}
	/>
{/if}

{#if pendingNoteLngLat}
	<NoteDialog onconfirm={handleNoteConfirm} oncancel={() => (pendingNoteLngLat = null)} />
{/if}

{#if scaleFlow.showDialog}
	<ScaleDialog
		pixelDistance={scaleFlow.pixelDist}
		onconfirm={(feetPerPixel) => scaleFlow.confirm(feetPerPixel)}
		oncancel={() => scaleFlow.cancel()}
	/>
{/if}

{#if selectionStore.boxActive}
	{@const r = selectionStore.boxRect}
	<div class="selection-box" style="left:{r.x}px;top:{r.y}px;width:{r.width}px;height:{r.height}px"></div>
{/if}

<style>
	.map-outer {
		flex: 1;
		position: relative;
	}
</style>
