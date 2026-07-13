<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let {
		title,
		collapsible = false,
		collapsed = $bindable(false),
		count
	}: {
		title: string;
		collapsible?: boolean;
		collapsed?: boolean;
		count?: number;
	} = $props();
</script>

{#if collapsible}
	<button
		class="section-header collapsible"
		aria-expanded={!collapsed}
		onclick={() => (collapsed = !collapsed)}
	>
		<span class="chevron" class:open={!collapsed}><ChevronRight size={12} /></span>
		<span class="title">{title}</span>
		{#if count !== undefined}
			<span class="count">{count}</span>
		{/if}
	</button>
{:else}
	<div class="section-header">
		<span class="title">{title}</span>
		{#if count !== undefined}
			<span class="count">{count}</span>
		{/if}
	</div>
{/if}

<style>
	.section-header {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		width: 100%;
	}

	.collapsible {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: var(--radius-sm);
	}

	.title {
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-dim);
	}

	.collapsible:hover .title {
		color: var(--text-muted);
	}

	.chevron {
		display: inline-flex;
		color: var(--text-dim);
		transition: transform 0.15s ease;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.count {
		margin-left: auto;
		padding: 0 var(--space-2);
		background: var(--bg-elevated);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		color: var(--text-muted);
		line-height: 16px;
	}
</style>
