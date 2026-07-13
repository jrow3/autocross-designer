<script lang="ts">
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import type { ToolDef } from '$lib/config/tools';
	import { tooltip } from './ui/tooltip';
	import ToolIcon from './ToolIcon.svelte';

	let {
		def,
		shortcut,
		el = $bindable()
	}: { def: ToolDef; shortcut?: string; el?: HTMLButtonElement } = $props();

	let active = $derived(toolStore.activeTool === def.tool);
</script>

<button
	bind:this={el}
	class="tool-btn"
	class:active
	aria-pressed={active}
	use:tooltip={{ text: def.description, shortcut, placement: 'top' }}
	onclick={() => toolStore.setTool(def.tool)}
>
	<ToolIcon tool={def.tool} />
	<span class="tool-label">{def.label}</span>
	{#if shortcut}
		<span class="shortcut-hint">{shortcut}</span>
	{/if}
</button>

<style>
	.tool-btn {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		color: var(--text-secondary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		white-space: nowrap;
		flex-shrink: 0;
		transition: background 0.12s ease, color 0.12s ease;
	}

	.tool-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.tool-btn.active {
		background: var(--accent);
		color: #fff;
	}

	.shortcut-hint {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-dim);
		background: var(--bg-base);
		padding: 1px var(--space-1);
		border-radius: var(--radius-sm);
		min-width: 16px;
		text-align: center;
	}

	.tool-btn.active .shortcut-hint {
		background: rgba(0, 0, 0, 0.25);
		color: rgba(255, 255, 255, 0.75);
	}
</style>
