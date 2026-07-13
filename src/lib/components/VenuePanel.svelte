<script lang="ts">
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import VenueList from './VenueList.svelte';
	import Button from './ui/Button.svelte';
	import X from '@lucide/svelte/icons/x';

	let { onclose }: { onclose: () => void } = $props();

	$effect(() => {
		if (modeStore.activeMode !== 'venue') onclose();
	});

	function handleWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="venue-panel">
	<div class="panel-header">
		<span class="panel-title">Venues</span>
		<Button variant="ghost" size="sm" icon label="Close venues panel" onclick={onclose}>
			<X size={16} />
		</Button>
	</div>
	<div class="panel-body">
		<VenueList />
	</div>
</div>

<style>
	.venue-panel {
		position: absolute;
		top: var(--space-2);
		left: var(--space-2);
		width: 280px;
		/* leave the bottom-left clear for the tool status chip */
		max-height: calc(100% - 70px);
		display: flex;
		flex-direction: column;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: calc(var(--z-map-ui) + 1);
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) var(--space-2) var(--space-1) var(--space-3);
		flex-shrink: 0;
	}

	.panel-title {
		font-size: var(--text-md);
		font-weight: 600;
		color: var(--text-primary);
	}

	.panel-body {
		padding: 0 var(--space-3) var(--space-3);
		overflow-y: auto;
	}
</style>
