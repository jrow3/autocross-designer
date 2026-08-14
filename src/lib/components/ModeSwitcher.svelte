<script lang="ts">
	import { MODES } from '$lib/config/modes';
	import { modeStore } from '$lib/stores/modeStore.svelte';
</script>

<div class="mode-switcher" role="tablist" aria-label="Editor mode">
	{#each MODES as mode, i (mode.id)}
		<button
			role="tab"
			aria-selected={modeStore.activeMode === mode.id}
			class:active={modeStore.activeMode === mode.id}
			onclick={() => modeStore.setMode(mode.id)}
		>
			<span class="step">{i + 1}</span>
			{mode.label}
		</button>
	{/each}
</div>

<style>
	.mode-switcher {
		display: flex;
		gap: 2px;
		padding: 3px;
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--edge-highlight);
	}

	.mode-switcher button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		height: 32px;
		padding: 0 var(--space-4);
		background: transparent;
		border: none;
		border-radius: calc(var(--radius-lg) - 3px);
		font-family: var(--font-ui);
		font-size: var(--text-md);
		font-weight: 550;
		color: var(--text-muted);
		white-space: nowrap;
		cursor: pointer;
		transition: background 0.12s ease, color 0.12s ease;
	}

	.step {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 17px;
		height: 17px;
		border-radius: 50%;
		border: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-dim);
	}

	.mode-switcher button:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.mode-switcher button.active {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.mode-switcher button.active .step {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}
</style>
