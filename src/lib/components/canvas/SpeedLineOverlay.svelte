<script lang="ts">
	import { onMount } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { simStore } from '$lib/stores/simStore.svelte';
	import { speedColor } from '$lib/engine/speedColors';

	// Speed-colored driving line as an SVG overlay redrawn from map.project().
	// One implementation serves both modes: ImageMap has no working GeoJSON
	// layers, and this also sidesteps line-gradient quirks on pinned Mapbox.
	const MAX_DRAWN_SEGMENTS = 150;

	let container: HTMLDivElement;
	let svgEl: SVGSVGElement | null = null;

	function rebuild() {
		svgEl?.remove();
		svgEl = null;
		const map = mapStore.map;
		const result = simStore.result;
		if (!map || !result || result.points.length < 2) return;

		const speeds = result.points.map((p) => p.speedMph);
		const speedMin = Math.min(...speeds);
		const range = Math.max(Math.max(...speeds) - speedMin, 1);

		const step = Math.max(1, Math.ceil(result.points.length / MAX_DRAWN_SEGMENTS));
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
		svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';

		for (let i = step; i < result.points.length; i += step) {
			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			const t = (result.points[i].speedMph - speedMin) / range;
			line.setAttribute('stroke', speedColor(t));
			line.setAttribute('stroke-width', '4');
			line.setAttribute('stroke-linecap', 'round');
			svg.appendChild(line);
		}
		container.appendChild(svg);
		svgEl = svg;
		reposition();
	}

	function reposition() {
		const map = mapStore.map;
		const result = simStore.result;
		if (!map || !svgEl || !result) return;
		const step = Math.max(1, Math.ceil(result.points.length / MAX_DRAWN_SEGMENTS));
		const lines = svgEl.children;
		let lineIdx = 0;
		let prev = map.project(result.points[0].lngLat as [number, number]);
		for (let i = step; i < result.points.length && lineIdx < lines.length; i += step) {
			const cur = map.project(result.points[i].lngLat as [number, number]);
			const line = lines[lineIdx++] as SVGLineElement;
			line.setAttribute('x1', String(prev.x));
			line.setAttribute('y1', String(prev.y));
			line.setAttribute('x2', String(cur.x));
			line.setAttribute('y2', String(cur.y));
			prev = cur;
		}
	}

	onMount(() => {
		const map = mapStore.map;
		if (!map) return;
		map.on('move', reposition);
		map.on('zoom', reposition);
		return () => {
			map.off('move', reposition);
			map.off('zoom', reposition);
			svgEl?.remove();
		};
	});

	$effect(() => {
		void simStore.result;
		rebuild();
	});
</script>

<div class="speed-line-container" bind:this={container}></div>

<style>
	.speed-line-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 5;
	}
</style>
