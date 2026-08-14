<script lang="ts">
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { ruleStore } from '$lib/stores/ruleStore.svelte';
	import { createMarker, wrapForMapbox, type AnyMarker } from '$lib/engine/markerFactory';

	// Warn-severity findings with a location render as on-map warning markers.
	let markers: AnyMarker[] = [];

	$effect(() => {
		const warns = ruleStore.findings.filter((f) => f.severity === 'warn' && f.location);
		markers.forEach((m) => m.remove());
		markers = [];

		const map = mapStore.map;
		if (!map) return;
		for (const finding of warns) {
			const inner = document.createElement('div');
			inner.className = 'compliance-marker';
			inner.textContent = '!';
			inner.title = finding.message;
			const wrapper = wrapForMapbox(mapStore.mode, inner);
			markers.push(
				createMarker(mapStore.mode, { element: wrapper })
					.setLngLat(finding.location as [number, number])
					.addTo(map)
			);
		}

		return () => {
			markers.forEach((m) => m.remove());
			markers = [];
		};
	});
</script>

<style>
	:global(.compliance-marker) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: #f59e0b;
		color: #1a1a1a;
		border: 2px solid #fff;
		border-radius: 50%;
		font-weight: 800;
		font-size: 12px;
		line-height: 1;
		box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
		cursor: help;
	}
</style>
