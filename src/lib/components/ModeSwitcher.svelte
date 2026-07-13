<script lang="ts">
	import { MODES } from '$lib/config/modes';
	import { modeStore } from '$lib/stores/modeStore.svelte';
</script>

<div class="mode-switcher" role="tablist" aria-label="Editor mode">
	{#each MODES as mode (mode.id)}
		<button
			role="tab"
			aria-selected={modeStore.activeMode === mode.id}
			class:active={modeStore.activeMode === mode.id}
			onclick={() => modeStore.setMode(mode.id)}
		>
			{mode.label}
		</button>
	{/each}
</div>

<style>
	.mode-switcher {
		display: flex;
		gap: 2px;
		padding: 2px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.mode-switcher button {
		padding: var(--space-1) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-muted);
		white-space: nowrap;
		cursor: pointer;
		transition: background 0.12s ease, color 0.12s ease;
	}

	.mode-switcher button:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.mode-switcher button.active {
		background: var(--accent);
		color: #fff;
	}
</style>
