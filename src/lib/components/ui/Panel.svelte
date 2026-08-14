<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let {
		title,
		count,
		countTone = 'neutral',
		collapsible = true,
		collapsed = $bindable(false),
		children
	}: {
		title: string;
		count?: number;
		countTone?: 'neutral' | 'warn';
		collapsible?: boolean;
		collapsed?: boolean;
		children: Snippet;
	} = $props();
</script>

<section class="panel">
	{#if collapsible}
		<button class="panel-header clickable" aria-expanded={!collapsed} onclick={() => (collapsed = !collapsed)}>
			<span class="tick"></span>
			<span class="title">{title}</span>
			{#if count !== undefined && count > 0}
				<span class="count" class:warn={countTone === 'warn'}>{count}</span>
			{/if}
			<span class="chevron" class:open={!collapsed}><ChevronRight size={14} /></span>
		</button>
	{:else}
		<div class="panel-header">
			<span class="tick"></span>
			<span class="title">{title}</span>
			{#if count !== undefined && count > 0}
				<span class="count" class:warn={countTone === 'warn'}>{count}</span>
			{/if}
		</div>
	{/if}
	{#if !collapsed}
		<div class="panel-body">
			{@render children()}
		</div>
	{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--edge-highlight), var(--shadow-sm);
		overflow: hidden;
		flex-shrink: 0;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		min-height: 40px;
		padding: 0 var(--space-3);
		background: var(--bg-elevated);
		border: none;
		border-bottom: 1px solid var(--border-subtle);
		font-family: var(--font-ui);
		text-align: left;
	}

	.panel-header.clickable {
		cursor: pointer;
	}

	.panel-header.clickable:hover .title {
		color: var(--text-primary);
	}

	.tick {
		width: 3px;
		height: 16px;
		background: var(--accent);
		border-radius: 2px;
		flex-shrink: 0;
	}

	.title {
		font-size: var(--text-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-secondary);
		transition: color 0.12s ease;
	}

	.count {
		margin-left: auto;
		min-width: 22px;
		padding: 0 var(--space-2);
		background: var(--bg-base);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-muted);
		line-height: 19px;
		text-align: center;
	}

	.count.warn {
		background: var(--warning);
		border-color: var(--warning);
		color: #1a1408;
		font-weight: 700;
	}

	.chevron {
		display: inline-flex;
		margin-left: var(--space-1);
		color: var(--text-dim);
		transition: transform 0.15s ease;
	}

	.panel-header .chevron:only-of-type,
	.count + .chevron {
		margin-left: var(--space-1);
	}

	.panel-header:not(:has(.count)) .chevron {
		margin-left: auto;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.panel-body {
		padding: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
