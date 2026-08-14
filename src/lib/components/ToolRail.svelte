<script lang="ts">
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import { numberCones } from '$lib/engine/coneNumbering';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { shortcutLabel } from '$lib/config/shortcuts';
	import { tooltip } from './ui/tooltip';
	import ToolIcon from './ToolIcon.svelte';
	import ToolInlineSettings from './ToolInlineSettings.svelte';
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

{#snippet railButton(def: (typeof TOOL_DEFS)[number])}
	{@const shortcut = shortcutLabel(def.tool, modeStore.activeMode)}
	<button
		bind:this={toolEls[def.tool]}
		class="rail-btn"
		class:active={toolStore.activeTool === def.tool}
		aria-pressed={toolStore.activeTool === def.tool}
		use:tooltip={{ text: `${def.label} — ${def.description}`, shortcut, placement: 'right' }}
		onclick={() => toolStore.setTool(def.tool)}
	>
		<ToolIcon tool={def.tool} />
		{#if shortcut}
			<span class="key-chip">{shortcut}</span>
		{/if}
	</button>
{/snippet}

<nav class="tool-rail" aria-label="Tools">
	{#if modeStore.activeMode === 'venue'}
		<button
			class="rail-btn action-btn"
			use:tooltip={{ text: 'Load venue…', placement: 'right' }}
			onclick={onloadvenue}
		>
			<MapPin size={16} />
		</button>
		<div class="divider"></div>
	{/if}
	{#if modeStore.activeMode === 'annotate'}
		<button
			class="rail-btn action-btn"
			use:tooltip={{ text: 'Number cones', placement: 'right' }}
			onclick={runConeNumbering}
		>
			<ListOrdered size={16} />
		</button>
		{#if Object.keys(courseStore.course.coneNumbers).length > 0}
			<button
				class="rail-btn action-btn"
				use:tooltip={{ text: 'Clear cone numbers', placement: 'right' }}
				onclick={clearConeNumbers}
			>
				<ListX size={16} />
			</button>
		{/if}
		<div class="divider"></div>
	{/if}

	{#each modeTools as def (def.tool)}
		{@render railButton(def)}
	{/each}

	<div class="divider"></div>

	{#each universalTools as def (def.tool)}
		{@render railButton(def)}
	{/each}
</nav>

<ToolInlineSettings anchor={toolEls[toolStore.activeTool]} placement="right" />

<style>
	.tool-rail {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		width: 48px;
		padding: var(--space-2) 0;
		background: var(--bg-base);
		border-right: 1px solid var(--border-subtle);
		overflow-y: auto;
		flex-shrink: 0;
	}

	.rail-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: transparent;
		color: var(--text-muted);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.12s ease, color 0.12s ease;
	}

	.rail-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.rail-btn.active {
		background: var(--accent-dim);
		color: var(--accent);
	}

	.key-chip {
		position: absolute;
		right: 2px;
		bottom: 1px;
		font-family: var(--font-mono);
		font-size: 9px;
		line-height: 1;
		color: var(--text-dim);
	}

	.rail-btn.active .key-chip {
		color: var(--accent);
	}

	.divider {
		width: 20px;
		height: 1px;
		background: var(--border);
		margin: var(--space-1) 0;
		flex-shrink: 0;
	}
</style>
