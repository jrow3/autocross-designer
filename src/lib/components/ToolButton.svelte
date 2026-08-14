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
	use:tooltip={{ text: def.description, shortcut, placement: 'bottom' }}
	onclick={() => toolStore.setTool(def.tool)}
>
	<ToolIcon tool={def.tool} size={17} />
	<span class="tool-label">{def.label}</span>
	{#if shortcut}
		<span class="shortcut-hint">{shortcut}</span>
	{/if}
</button>

<style>
	.tool-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		height: 38px;
		padding: 0 var(--space-3);
		background: var(--bg-surface);
		color: var(--text-secondary);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		box-shadow: var(--edge-highlight);
		cursor: pointer;
		font-family: var(--font-ui);
		font-size: var(--text-md);
		font-weight: 500;
		white-space: nowrap;
		flex-shrink: 0;
		transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
	}

	.tool-btn:hover {
		background: var(--bg-elevated);
		border-color: var(--border);
		color: var(--text-primary);
	}

	.tool-btn.active {
		background: var(--accent-dim);
		border-color: var(--accent);
		color: var(--accent);
	}

	.shortcut-hint {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-dim);
		background: var(--bg-base);
		border: 1px solid var(--border-subtle);
		padding: 1px 5px;
		border-radius: var(--radius-sm);
		min-width: 18px;
		line-height: 15px;
		text-align: center;
	}

	.tool-btn.active .shortcut-hint {
		background: transparent;
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
