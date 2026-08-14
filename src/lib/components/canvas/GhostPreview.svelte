<script lang="ts">
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { computeGateCones, computeDirectionalCones } from '$lib/engine/gateLogic';
	import { computeSlalomPositions } from '$lib/engine/slalomLogic';
	import { distanceFeet } from '$lib/engine/geo';
	import { createMarker, wrapForMapbox, type AnyMarker } from '$lib/engine/markerFactory';
	import PreviewLine from '../PreviewLine.svelte';
	import type { LngLat } from '$lib/types/course';
	import type { createGateFlow, createSlalomFlow } from '$lib/interactions/placementFlows.svelte';

	let {
		gateFlow,
		slalomFlow,
		mousePos
	}: {
		gateFlow: ReturnType<typeof createGateFlow>;
		slalomFlow: ReturnType<typeof createSlalomFlow>;
		mousePos: LngLat | null;
	} = $props();

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
		ghostMarkers.forEach((m) => m.remove());
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

		return () => {
			ghostMarkers.forEach((m) => m.remove());
			ghostMarkers = [];
		};
	});
</script>

{#if previewFrom && mousePos}
	<PreviewLine from={previewFrom} to={mousePos} />
{/if}
