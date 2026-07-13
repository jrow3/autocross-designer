<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon,
		message,
		hint
	}: {
		icon?: Snippet;
		message: string;
		hint?: string;
	} = $props();
</script>

<div class="empty-state">
	{#if icon}
		<span class="icon">{@render icon()}</span>
	{/if}
	<p class="message">{message}</p>
	{#if hint}
		<p class="hint">{hint}</p>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		text-align: center;
	}

	.icon {
		display: inline-flex;
		width: 20px;
		height: 20px;
		opacity: 0.5;
		color: var(--text-muted);
	}

	.message {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.hint {
		font-size: var(--text-xs);
		color: var(--text-dim);
	}
</style>
