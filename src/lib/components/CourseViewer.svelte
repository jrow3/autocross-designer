<script lang="ts">
	import { onMount } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { simStore } from '$lib/stores/simStore.svelte';
	import { ruleStore } from '$lib/stores/ruleStore.svelte';
	import { setEditCopyHandoff, setFitCourseOnLoad, setSkipBanner } from '$lib/services/handoff';
	import Copy from '@lucide/svelte/icons/copy';
	import Button from './ui/Button.svelte';
	import CourseCanvas from './canvas/CourseCanvas.svelte';

	let { title }: { title: string } = $props();

	let canvas = $state<CourseCanvas>();

	const toggleableLayers = [
		{ key: 'cones' as const, label: 'Cones' },
		{ key: 'workers' as const, label: 'Workers' },
		{ key: 'notes' as const, label: 'Notes' },
		{ key: 'drivingLine' as const, label: 'Driving Line' },
		{ key: 'speedLine' as const, label: 'Speed Line' },
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
		mapStore.setMode('map');
		canvas?.initMapMode();
		const stopSim = simStore.init();
		const stopRules = ruleStore.init();
		return () => {
			stopSim();
			stopRules();
		};
	});
</script>

<div class="viewer">
	<CourseCanvas
		bind:this={canvas}
		readonly={true}
		controls="viewer"
		onready={() => layerStore.setVisible('sketches', false)}
	/>

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
</div>

<style>
	.viewer {
		width: 100%;
		height: 100vh;
		position: relative;
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
