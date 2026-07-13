<script lang="ts">
	import type mapboxgl from 'mapbox-gl';
	import { onMount, setContext } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { computeGateCones, computeDirectionalCones } from '$lib/engine/gateLogic';
	import { offsetPointerPosition } from '$lib/engine/coneLogic';
	import { computeSlalomPositions } from '$lib/engine/slalomLogic';
	import { ImageMap } from '$lib/engine/imageMap';
	import { pickCourseItem } from '$lib/interactions/hitTest';
	import { initBoxSelection } from '$lib/interactions/boxSelect';
	import { initSketchPan } from '$lib/interactions/sketchPan';
	import { createGateFlow, createSlalomFlow, createScaleFlow, createHazardLineFlow } from '$lib/interactions/placementFlows.svelte';
	import { computeCourseBounds } from '$lib/engine/courseBounds';
	import { createMapboxMap } from '$lib/engine/mapSetup';
	import type { LngLat } from '$lib/types/course';
	import ConeMarker from './ConeMarker.svelte';
	import WorkerMarker from './WorkerMarker.svelte';
	import NoteMarker from './NoteMarker.svelte';
	import NoteDialog from './NoteDialog.svelte';
	import SlalomDialog from './SlalomDialog.svelte';
	import PreviewLine from './PreviewLine.svelte';
	import DrivingLine from './DrivingLine.svelte';
	import MeasurementOverlay from './MeasurementOverlay.svelte';
	import OutlineOverlay from './OutlineOverlay.svelte';
	import GridOverlay from './GridOverlay.svelte';
	import SketchOverlay from './SketchOverlay.svelte';
	import PolygonOverlay from './PolygonOverlay.svelte';
	import StagingOverlay from './StagingOverlay.svelte';
	import WorkerZoneOverlay from './WorkerZoneOverlay.svelte';
	import HazardOverlay from './HazardOverlay.svelte';
	import ConeNumberOverlay from './ConeNumberOverlay.svelte';
	import ModeBanner from './ModeBanner.svelte';
	import ScaleDialog from './ScaleDialog.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { autosave, loadAutosave } from '$lib/services/courseService';
	import { consumeEditCopyHandoff, consumeFitCourseOnLoad, consumeSkipBanner, hasSkipBanner } from '$lib/services/handoff';
	import { deserialize } from '$lib/engine/courseSerializer';
	import { createMarker, wrapForMapbox, type AnyMarker } from '$lib/engine/markerFactory';
	import { distanceFeet } from '$lib/engine/geo';
	import { selectionStore } from '$lib/stores/selectionStore.svelte';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { STAGING_COLOR, WORKER_ZONE_COLOR } from '$lib/config/palette';

	const BASE_ZOOM = 17;
	let container: HTMLDivElement;

	function generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
	}

	// Mode selection — skip banner if coming from shared link "Edit a Copy"
	let fromSharedLink = hasSkipBanner();
	let showBanner = $state(!fromSharedLink);

	// Multi-click tool flows
	const gateFlow = createGateFlow();
	const slalomFlow = createSlalomFlow();
	const scaleFlow = createScaleFlow();
	const hazardLineFlow = createHazardLineFlow();

	let pendingNoteLngLat: LngLat | null = $state(null);
	let mousePos: LngLat | null = $state(null);
	let nextNoteNumber = $state(1);

	let measurementOverlay = $state<MeasurementOverlay>();
	let outlineOverlay = $state<OutlineOverlay>();
	let gridOverlay = $state<GridOverlay>();
	let sketchOverlay = $state<SketchOverlay>();
	let stagingPolygonOverlay = $state<PolygonOverlay>();
	let workerZonePolygonOverlay = $state<PolygonOverlay>();

	setContext('map', mapStore);

	let previewFrom: LngLat | null = $derived(gateFlow.center ?? slalomFlow.start);

	let ghostPositions: LngLat[] = $derived.by(() => {
		if (!mousePos) return [];
		if (gateFlow.center && toolStore.activeTool === 'gate') {
			const { left, right } = computeGateCones(
				gateFlow.center, mousePos, toolStore.gateWidthFeet, mapStore.mode
			);
			const positions: LngLat[] = [left, right];
			if (toolStore.gateDirectionalCones) {
				const { leftDirectional, rightDirectional } = computeDirectionalCones(
					gateFlow.center, mousePos, toolStore.gateWidthFeet, mapStore.mode
				);
				positions.push(leftDirectional, rightDirectional);
			}
			return positions;
		}
		if (slalomFlow.start && !slalomFlow.end && toolStore.activeTool === 'slalom') {
			const spacing = toolStore.slalomSpacingFeet;
			const dist = distanceFeet(slalomFlow.start, mousePos, mapStore.mode);
			const count = dist != null && dist > 0 ? Math.max(2, Math.floor(dist / spacing) + 1) : 2;
			return computeSlalomPositions(slalomFlow.start, mousePos, { count, spacingFeet: spacing }, mapStore.mode);
		}
		return [];
	});

	let ghostMarkers: AnyMarker[] = [];

	$effect(() => {
		ghostMarkers.forEach(m => m.remove());
		ghostMarkers = [];

		const map = mapStore.map;
		if (!map || ghostPositions.length === 0) return;

		for (let i = 0; i < ghostPositions.length; i++) {
			const pos = ghostPositions[i];
			const inner = document.createElement('div');
			const isDirectional = i >= 2 && toolStore.activeTool === 'gate';
			inner.className = `cone-marker ${isDirectional ? 'marker-pointer' : 'marker-regular'} ghost-marker`;
			const wrapper = wrapForMapbox(mapStore.mode, inner);
			const m = createMarker(mapStore.mode, { element: wrapper })
				.setLngLat(pos as [number, number])
				.addTo(map);
			ghostMarkers.push(m);
		}
	});

	function tryClosePolygon(overlay: PolygonOverlay | undefined, e: any): boolean {
		if (!overlay) return false;
		const firstVertex = overlay.getFirstVertex();
		if (!firstVertex) return false;
		const map = mapStore.map;
		if (!map || !e.point) return false;
		const firstPx = map.project(firstVertex as [number, number]);
		const clickPx = e.point;
		const dx = firstPx.x - clickPx.x;
		const dy = firstPx.y - clickPx.y;
		if (dx * dx + dy * dy < 20 * 20) {
			overlay.close();
			return true;
		}
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleClick(e: any) {
		const lngLat: LngLat = [e.lngLat.lng, e.lngLat.lat];
		const tool = toolStore.activeTool;

		switch (tool) {
			case 'regular':
			case 'start-cone':
			case 'finish-cone':
				courseStore.pushUndo();
				courseStore.addCone({ id: generateId(), type: tool, lngLat, lockedTargetId: null });
				break;

			case 'trailer':
				courseStore.pushUndo();
				courseStore.addCone({ id: generateId(), type: 'trailer', lngLat, width: 80, height: 40, rotation: 0, lockedTargetId: null });
				break;

			case 'pointer': {
				const feetPerPixel = mapStore.mode === 'image' && mapStore.map && 'getScale' in mapStore.map
					? mapStore.map.getScale()
					: undefined;
				const pointerPos = offsetPointerPosition(
					lngLat, courseStore.course.cones, mapStore.mode, feetPerPixel
				);
				courseStore.pushUndo();
				courseStore.addCone({ id: generateId(), type: 'pointer', lngLat: pointerPos, lockedTargetId: null });
				break;
			}

			case 'gate':
				gateFlow.handleClick(lngLat);
				break;

			case 'slalom':
				slalomFlow.handleClick(lngLat);
				break;

			case 'worker':
				courseStore.pushUndo();
				courseStore.addWorker({
					id: generateId(),
					number: courseStore.course.workers.length + 1,
					lngLat
				});
				break;

			case 'drivingline':
				courseStore.pushUndo();
				courseStore.addWaypoint({ lngLat });
				break;

			case 'measure':
				measurementOverlay?.handleClick(lngLat);
				break;

			case 'courseoutline':
				outlineOverlay?.handleClick(lngLat);
				break;

			case 'note':
				pendingNoteLngLat = lngLat;
				break;

			case 'scale':
				scaleFlow.handleClick(lngLat);
				break;

			case 'sketch':
				break;

			case 'staging-area':
				if (tryClosePolygon(stagingPolygonOverlay, e)) return;
				stagingPolygonOverlay?.handleClick(e);
				return;

			case 'worker-zone':
				if (tryClosePolygon(workerZonePolygonOverlay, e)) return;
				workerZonePolygonOverlay?.handleClick(e);
				return;

			case 'hazard-point': {
				courseStore.pushUndo();
				courseStore.addHazardMarker({
					id: generateId(),
					type: 'point',
					coordinates: [lngLat],
					bufferFeet: toolStore.hazardBufferFeet
				});
				return;
			}

			case 'hazard-line':
				hazardLineFlow.handleClick(lngLat);
				return;

			case 'select': {
				const hit = pickCourseItem(courseStore.course, lngLat);
				selectionStore.clear();
				if (hit) selectionStore.select(hit.type, hit.id);
				break;
			}
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

	function handleNoteCancel() {
		pendingNoteLngLat = null;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleDblClick(e: any) {
		if (toolStore.activeTool === 'staging-area') {
			stagingPolygonOverlay?.handleDoubleClick(e);
		}
		if (toolStore.activeTool === 'worker-zone') {
			workerZonePolygonOverlay?.handleDoubleClick(e);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function handleMouseMove(e: any) {
		mousePos = [e.lngLat.lng, e.lngLat.lat];
		stagingPolygonOverlay?.handleMouseMove(e);
		workerZonePolygonOverlay?.handleMouseMove(e);
	}

	function updateMarkerScale() {
		const z = mapStore.zoom;
		const scale = Math.pow(2, z - BASE_ZOOM) * 0.1 * mapStore.markerSize;
		container?.style.setProperty('--marker-scale', String(scale));
	}

	let boxSelectCleanup: (() => void) | null = null;
	let sketchPanCleanup: (() => void) | null = null;

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

	$effect(() => {
		const _tool = toolStore.activeTool;
		gateFlow.reset();
		slalomFlow.reset();
		scaleFlow.reset();
		measurementOverlay?.cancelPending();
		outlineOverlay?.cancelPending();
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

	function handleModeSelect(mode: 'map' | 'image', imageSrc?: string, _fileName?: string) {
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
		mapStore.setMode(mode);

		if (mode === 'image' && imageSrc) {
			initImageMode(imageSrc);
		} else {
			initMapMode();
		}
	}

	function initMapMode() {
		const token = import.meta.env.VITE_MAPBOX_TOKEN;
		if (!token) {
			console.error('VITE_MAPBOX_TOKEN not set');
			return;
		}

		const map = createMapboxMap(container, {
			center: courseStore.course.mapCenter,
			zoom: courseStore.course.mapZoom,
			token
		});

		map.on('load', () => {
			mapStore.setMap(map);
			boxSelectCleanup = initBoxSelection(container, () => mapStore.map);
			sketchPanCleanup = initSketchPan(container, () => mapStore.map);
			if (consumeFitCourseOnLoad()) {
				setTimeout(() => fitBoundsToCourse(), 100);
			}
		});

		map.on('zoom', () => {
			mapStore.setZoom(map.getZoom());
			updateMarkerScale();
		});

		map.on('click', handleClick);
		map.on('mousemove', handleMouseMove);
		map.on('dblclick', handleDblClick);
		map.on('mousedown', (e: mapboxgl.MapMouseEvent) => sketchOverlay?.handleMouseDown(e));
		map.on('mousemove', (e: mapboxgl.MapMouseEvent) => sketchOverlay?.handleMouseMove(e));
		map.on('mouseup', () => sketchOverlay?.handleMouseUp());
		map.on('click', (e: mapboxgl.MapMouseEvent) => sketchOverlay?.handleClick(e));

		map.on('moveend', () => {
			const center = map.getCenter();
			courseStore.setMapView([center.lng, center.lat], map.getZoom());
		});
	}

	function initImageMode(imageSrc: string) {
		const imageMap = new ImageMap(container, imageSrc);

		imageMap.on('load', () => {
			mapStore.setMap(imageMap);
			// Start-in-venue invariant: this banner flow runs while modeStore.activeMode is still
			// 'venue' (deliberately never persisted), and 'venue' is scale's home mode.
			toolStore.setTool('scale');
			toolStore.setStatus('Calibrate: click two points with a known distance');
		});

		imageMap.on('zoom', () => {
			mapStore.setZoom(imageMap.getZoom());
			updateMarkerScale();
		});

		imageMap.on('click', handleClick);
		imageMap.on('mousemove', handleMouseMove);
		imageMap.on('mousedown', (e: any) => sketchOverlay?.handleMouseDown(e));
		imageMap.on('mousemove', (e: any) => sketchOverlay?.handleMouseMove(e));
		imageMap.on('mouseup', () => sketchOverlay?.handleMouseUp());
		imageMap.on('click', (e: any) => sketchOverlay?.handleClick(e));

		imageMap.on('move', () => {
			const center = imageMap.getCenter();
			courseStore.setMapView([center.lng, center.lat], imageMap.getZoom());
		});
	}

	function handleMapKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
	}

	export function fitBoundsToCourse(data?: import('$lib/types/course').CourseData) {
		const map = mapStore.map;
		if (!map || !('fitBounds' in map)) return;
		const bounds = computeCourseBounds(data ?? courseStore.course);
		if (!bounds) return;
		map.fitBounds(bounds, { padding: 0, animate: false });
	}

	onMount(() => {
		document.addEventListener('keydown', handleMapKeydown);
		if (consumeSkipBanner()) {
			handleModeSelect('map');
		}
		return () => {
			document.removeEventListener('keydown', handleMapKeydown);
			boxSelectCleanup?.();
			sketchPanCleanup?.();
			mapStore.map?.remove();
		};
	});
</script>

<div class="map-outer" style="--map-cursor: {TOOL_DEFS.find((d) => d.tool === toolStore.activeTool)?.cursor ?? 'crosshair'}">
	<div class="map-container" bind:this={container}></div>

	{#if showBanner}
		<ModeBanner onselect={handleModeSelect} />
	{/if}

	{#if mapStore.map}
		{#if layerStore.isVisible('cones')}
			{#each courseStore.course.cones as cone (cone.id)}
				<ConeMarker {cone} />
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
			<MeasurementOverlay bind:this={measurementOverlay} />
		{/if}
		{#if layerStore.isVisible('courseOutline')}
			<OutlineOverlay bind:this={outlineOverlay} />
		{/if}
		<GridOverlay bind:this={gridOverlay} />
		{#if layerStore.isVisible('sketches')}
			<SketchOverlay bind:this={sketchOverlay} />
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
				const nextStation = Math.max(0, ...courseStore.course.workerZones.map(z => z.stationNumber)) + 1;
				courseStore.pushUndo();
				courseStore.addWorkerZone({
					id: generateId(),
					vertices,
					stationNumber: nextStation
				});
			}}
		/>
	{/if}
</div>

{#if previewFrom && mousePos}
	<PreviewLine from={previewFrom} to={mousePos} />
{/if}

{#if slalomFlow.showDialog && slalomFlow.start && slalomFlow.end}
	<SlalomDialog
		start={slalomFlow.start}
		end={slalomFlow.end}
		onconfirm={(count, spacing) => slalomFlow.confirm(count, spacing)}
		oncancel={() => slalomFlow.cancel()}
	/>
{/if}

{#if pendingNoteLngLat}
	<NoteDialog onconfirm={handleNoteConfirm} oncancel={handleNoteCancel} />
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
		--marker-scale: 1;
	}

	.map-container {
		position: absolute;
		inset: 0;
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
