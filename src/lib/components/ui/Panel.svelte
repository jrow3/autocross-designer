<script lang="ts">
	import type { Snippet } from 'svelte';
	import SectionHeader from './SectionHeader.svelte';

	let {
		title,
		count,
		collapsible = false,
		collapsed = $bindable(false),
		children
	}: {
		title: string;
		count?: number;
		collapsible?: boolean;
		collapsed?: boolean;
		children: Snippet;
	} = $props();
</script>

<section class="panel">
	<div class="panel-header">
		<SectionHeader {title} {count} {collapsible} bind:collapsed />
	</div>
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
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.panel-header {
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}

	.panel-body {
		padding: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		overflow-y: auto;
	}
</style>
