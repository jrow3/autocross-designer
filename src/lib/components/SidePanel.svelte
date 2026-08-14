<script lang="ts">
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import { ruleStore } from '$lib/stores/ruleStore.svelte';
	import type { SavedCourse } from '$lib/services/courseService';
	import type { CourseData } from '$lib/types/course';
	import Panel from './ui/Panel.svelte';
	import CoursePanel from './panels/CoursePanel.svelte';
	import StatsPanel from './panels/StatsPanel.svelte';
	import FindingsPanel from './panels/FindingsPanel.svelte';
	import GeneratorPanel from './panels/GeneratorPanel.svelte';

	let {
		onsave,
		onexport,
		onimport,
		onprint,
		onexportsvg,
		onfitcourse,
		oncourseopened
	}: {
		onsave: () => void;
		onexport: () => void;
		onimport: () => void;
		onprint: () => void;
		onexportsvg: () => void;
		onfitcourse?: (data: CourseData) => void;
		oncourseopened?: (course: SavedCourse) => void;
	} = $props();

	let checksCollapsed = $state(false);
	let flowCollapsed = $state(false);
	let generatorCollapsed = $state(false);
	let courseCollapsed = $state(true);

	// Review & Share leads with the course/library panel
	$effect(() => {
		if (modeStore.activeMode === 'share') courseCollapsed = false;
	});
</script>

<aside class="side-panel">
	<Panel title="Checks" count={ruleStore.warnCount} countTone="warn" bind:collapsed={checksCollapsed}>
		<FindingsPanel />
	</Panel>

	<Panel title="Flow" bind:collapsed={flowCollapsed}>
		<StatsPanel />
	</Panel>

	{#if modeStore.activeMode === 'design'}
		<Panel title="Generator" bind:collapsed={generatorCollapsed}>
			<GeneratorPanel />
		</Panel>
	{/if}

	<Panel title="Course" bind:collapsed={courseCollapsed}>
		<CoursePanel {onsave} {onexport} {onimport} {onprint} {onexportsvg} {onfitcourse} {oncourseopened} />
	</Panel>
</aside>

<style>
	.side-panel {
		width: 340px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--bg-base);
		border-left: 1px solid var(--border-subtle);
		overflow-y: auto;
	}
</style>
