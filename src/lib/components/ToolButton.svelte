<script lang="ts">
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { TOOL_SHORTCUTS } from '$lib/config/shortcuts';
	import type { ToolDef } from '$lib/config/tools';
	import { tooltip } from './ui/tooltip';
	import ToolIcon from './ToolIcon.svelte';

	let { def }: { def: ToolDef } = $props();

	const shortcut = TOOL_SHORTCUTS[def.tool];

	let active = $derived(toolStore.activeTool === def.tool);
</script>

<button
	class="tool-btn"
	class:active
	aria-pressed={active}
	use:tooltip={{ text: def.description, shortcut, placement: 'right' }}
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
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		color: var(--text-secondary);
		border: none;
		border-radius: var(--radius-md);
		box-shadow: inset 2px 0 0 transparent;
		cursor: pointer;
		font-family: var(--font-ui);
		font-size: var(--text-md);
		text-align: left;
		transition: background 0.12s ease, box-shadow 0.12s ease, color 0.12s ease;
	}

	.tool-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.tool-btn.active {
		background: var(--accent);
		box-shadow: inset 2px 0 0 var(--accent-light);
		color: #fff;
	}

	.tool-label {
		flex: 1;
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
