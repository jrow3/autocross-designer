<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { splineLengthFeet } from '$lib/engine/courseStats';
	import { captureMapCanvas, renderPrintCanvas, type PrintLayout } from '$lib/engine/printCapture';
	import { exportCoursePng, exportCoursePdf } from '$lib/services/printExport';
	import BaseDialog from './BaseDialog.svelte';
	import Button from './ui/Button.svelte';

	let { onclose }: { onclose: () => void } = $props();

	let title = $state('Autocross Course');
	let showConeCount = $state(true);
	let showLegend = $state(true);
	let showScaleBar = $state(true);
	let dottedPath = $state(false);
	let highRes = $state(false);
	let exporting = $state(false);

	function coneCount(): number { return courseStore.course.cones.length; }

	function lineLength(): string {
		if (courseStore.course.drivingLine.length < 2) return '-- ft';
		const len = splineLengthFeet(courseStore.course, mapStore.mode, mapStore.feetPerPixel ?? undefined);
		return len == null ? '-- ft' : `${len.toFixed(0)} ft`;
	}

	function captureOptions() {
		return {
			map: mapStore.map,
			mode: mapStore.mode,
			course: courseStore.course,
			mapFade: mapStore.mapFade,
			markerSize: mapStore.markerSize,
			scale: highRes ? 2 : 1,
			pathStyle: (dottedPath ? 'dotted' : 'dashed') as 'dashed' | 'dotted',
			isLayerVisible: (layer: 'cones' | 'workers' | 'notes' | 'barriers' | 'drivingLine') =>
				layerStore.isVisible(layer)
		};
	}

	async function renderCourseCanvas(): Promise<HTMLCanvasElement | null> {
		const mapCanvas = await captureMapCanvas(captureOptions());
		if (!mapCanvas) return null;
		const layout: PrintLayout = { title, showConeCount, showLegend, showScaleBar };
		return renderPrintCanvas(mapCanvas, layout, coneCount(), lineLength());
	}

	async function exportImage() {
		exporting = true;
		const canvas = await renderCourseCanvas();
		if (canvas) exportCoursePng(canvas, title);
		exporting = false;
	}

	async function exportPDF() {
		exporting = true;
		const canvas = await renderCourseCanvas();
		if (canvas) exportCoursePdf(canvas, title);
		exporting = false;
	}
</script>

<BaseDialog title="Print / Export" onclose={onclose}>
	{#snippet children()}
		<div class="dialog-field">
			<label for="print-title">Course Title</label>
			<input id="print-title" type="text" bind:value={title} />
		</div>
		<div class="checkboxes">
			<label><input type="checkbox" bind:checked={showConeCount} /> Cone count & line length</label>
			<label><input type="checkbox" bind:checked={showLegend} /> Element legend</label>
			<label><input type="checkbox" bind:checked={showScaleBar} /> Branding</label>
			<label><input type="checkbox" bind:checked={dottedPath} /> Nationals-style dotted path</label>
			<label><input type="checkbox" bind:checked={highRes} /> High resolution (2×, elements only)</label>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="secondary" onclick={onclose}>Cancel</Button>
		<Button variant="primary" onclick={exportImage} disabled={exporting}>
			{exporting ? 'Exporting...' : 'Save PNG'}
		</Button>
		<Button variant="primary" onclick={exportPDF} disabled={exporting}>
			{exporting ? 'Exporting...' : 'Save PDF'}
		</Button>
	{/snippet}
</BaseDialog>

<style>
	.checkboxes {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.checkboxes label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.checkboxes input {
		accent-color: var(--accent-light);
	}
</style>
