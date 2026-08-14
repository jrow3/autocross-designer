<script lang="ts">
	import { onMount } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { selectionStore } from '$lib/stores/selectionStore.svelte';

	// Walls render as thick SVG polylines repositioned from map.project().
	let container: HTMLDivElement;
	let svgEl: SVGSVGElement | null = null;

	function rebuild() {
		svgEl?.remove();
		svgEl = null;
		const map = mapStore.map;
		if (!map || courseStore.course.barriers.length === 0) return;

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
		svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';
		for (const barrier of courseStore.course.barriers) {
			const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
			poly.dataset.barrierId = barrier.id;
			poly.setAttribute('fill', 'none');
			poly.setAttribute('stroke', 'var(--barrier)');
			poly.setAttribute('stroke-width', selectionStore.isSelected('barrier', barrier.id) ? '7' : '5');
			poly.setAttribute('stroke-linecap', 'square');
			poly.setAttribute('stroke-linejoin', 'miter');
			if (selectionStore.isSelected('barrier', barrier.id)) {
				poly.setAttribute('stroke', 'var(--accent)');
			}
			svg.appendChild(poly);
		}
		container.appendChild(svg);
		svgEl = svg;
		reposition();
	}

	function reposition() {
		const map = mapStore.map;
		if (!map || !svgEl) return;
		for (const poly of svgEl.children as unknown as SVGPolylineElement[]) {
			const barrier = courseStore.course.barriers.find((b) => b.id === (poly as SVGPolylineElement).dataset.barrierId);
			if (!barrier) continue;
			const pts = barrier.points
				.map((p) => {
					const px = map.project(p as [number, number]);
					return `${px.x},${px.y}`;
				})
				.join(' ');
			poly.setAttribute('points', pts);
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
		void JSON.stringify(courseStore.course.barriers);
		void selectionStore.selected.length;
		rebuild();
	});
</script>

<div class="barrier-container" bind:this={container}></div>

<style>
	.barrier-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 5;
	}
</style>
