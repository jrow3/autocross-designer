<script lang="ts">
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import { numberCones } from '$lib/engine/coneNumbering';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { shortcutLabel } from '$lib/config/shortcuts';
	import ToolButton from './ToolButton.svelte';
	import ToolInlineSettings from './ToolInlineSettings.svelte';
	import Button from './ui/Button.svelte';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import ListX from '@lucide/svelte/icons/list-x';

	let { onloadvenue }: { onloadvenue: () => void } = $props();

	let toolEls = $state<Record<string, HTMLButtonElement | undefined>>({});

	let modeTools = $derived(
		TOOL_DEFS.filter(
			(def) => def.mode === modeStore.activeMode && (!def.imageModeOnly || mapStore.mode === 'image')
		)
	);
	const universalTools = TOOL_DEFS.filter((def) => def.mode === 'universal');

	function runConeNumbering() {
		const { cones, workerZones, drivingLine } = courseStore.course;
		if (workerZones.length === 0) {
			toolStore.setStatus('Draw worker zones first');
			return;
		}
		const numbers = numberCones(cones, workerZones, drivingLine);
		courseStore.pushUndo();
		courseStore.setConeNumbers(numbers);
		layerStore.setVisible('coneNumbers', true);
		toolStore.setStatus(`Numbered ${Object.keys(numbers).length} cones`);
	}

	function clearConeNumbers() {
		courseStore.pushUndo();
		courseStore.clearConeNumbers();
	}
</script>

<div class="toolbar">
	{#if modeStore.activeMode === 'venue'}
		<div class="mode-actions">
			<Button variant="secondary" onclick={onloadvenue}>
				<MapPin size={15} />
				Load venue…
			</Button>
		</div>
		<div class="divider"></div>
	{/if}
	{#if modeStore.activeMode === 'annotate'}
		<div class="mode-actions">
			<Button variant="secondary" onclick={runConeNumbering}>
				<ListOrdered size={15} />
				Number cones
			</Button>
			{#if Object.keys(courseStore.course.coneNumbers).length > 0}
				<Button variant="secondary" onclick={clearConeNumbers}>
					<ListX size={15} />
					Clear
				</Button>
			{/if}
		</div>
		<div class="divider"></div>
	{/if}

	{#each modeTools as def (def.tool)}
		<ToolButton
			{def}
			shortcut={shortcutLabel(def.tool, modeStore.activeMode)}
			bind:el={toolEls[def.tool]}
		/>
	{/each}

	<div class="divider"></div>

	{#each universalTools as def (def.tool)}
		<ToolButton {def} shortcut={shortcutLabel(def.tool, modeStore.activeMode)} bind:el={toolEls[def.tool]} />
	{/each}
</div>

<ToolInlineSettings anchor={toolEls[toolStore.activeTool]} />

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 56px;
		padding: 0 var(--space-4);
		background: var(--bg-base);
		border-bottom: 1px solid var(--border-subtle);
		box-shadow: var(--edge-highlight);
		overflow-x: auto;
		flex-shrink: 0;
	}

	.mode-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.divider {
		width: 1px;
		height: 26px;
		background: var(--border);
		margin: 0 var(--space-2);
		flex-shrink: 0;
	}
</style>
