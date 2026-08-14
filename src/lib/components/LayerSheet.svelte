<script lang="ts">
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import X from '@lucide/svelte/icons/x';

	let {
		layers,
		onclose
	}: {
		layers: { key: Parameters<typeof layerStore.isVisible>[0]; label: string }[];
		onclose: () => void;
	} = $props();
</script>

<div
	class="sheet-scrim"
	role="presentation"
	onclick={onclose}
	onkeydown={(e) => e.key === 'Escape' && onclose()}
></div>
<div class="layer-sheet" role="dialog" aria-label="Map layers">
	<div class="sheet-header">
		<span class="sheet-title">Layers</span>
		<button class="sheet-close" aria-label="Close" onclick={onclose}><X size={18} /></button>
	</div>
	{#each layers as layer (layer.key)}
		<label class="sheet-row">
			<input
				type="checkbox"
				checked={layerStore.isVisible(layer.key)}
				onchange={() => layerStore.toggle(layer.key)}
			/>
			<span>{layer.label}</span>
		</label>
	{/each}
</div>

<style>
	.sheet-scrim {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		z-index: var(--z-dialog);
	}

	.layer-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		max-height: 70vh;
		overflow-y: auto;
		background: var(--bg-surface);
		border-top: 1px solid var(--border);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: var(--space-2) var(--space-3);
		padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
		z-index: calc(var(--z-dialog) + 1);
	}

	.sheet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) 0;
	}

	.sheet-title {
		font-size: var(--text-md);
		font-weight: 600;
		color: var(--text-primary);
	}

	.sheet-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
	}

	.sheet-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 44px;
		font-size: var(--text-base);
		color: var(--text-secondary);
		cursor: pointer;
	}

	.sheet-row input {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
	}
</style>
