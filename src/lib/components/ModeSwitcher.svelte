<script lang="ts">
	import { MODES } from '$lib/config/modes';
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let activeIndex = $derived(MODES.findIndex((m) => m.id === modeStore.activeMode));
</script>

<div class="mode-switcher" role="tablist" aria-label="Editor workflow">
	{#each MODES as mode, i (mode.id)}
		{#if i > 0}
			<span class="flow-arrow" class:traveled={i <= activeIndex} aria-hidden="true">
				<ChevronRight size={13} />
			</span>
		{/if}
		<button
			role="tab"
			aria-selected={modeStore.activeMode === mode.id}
			class:active={modeStore.activeMode === mode.id}
			class:visited={i < activeIndex}
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
		align-items: center;
		gap: 1px;
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
		height: 34px;
		padding: 0 var(--space-3) 0 var(--space-2);
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
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--bg-elevated);
		border: 1.5px solid var(--border);
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 700;
		color: var(--text-secondary);
		transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
	}

	.flow-arrow {
		display: inline-flex;
		color: var(--text-dim);
		margin: 0 -1px;
	}

	.flow-arrow.traveled {
		color: var(--accent);
	}

	.mode-switcher button:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.mode-switcher button:hover .step {
		border-color: var(--accent);
	}

	/* stages you've moved past keep an accent trace so the flow reads 1 -> 4 */
	.mode-switcher button.visited .step {
		border-color: var(--accent);
		color: var(--accent);
	}

	.mode-switcher button.active {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.mode-switcher button.active .step {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
		box-shadow: 0 0 8px rgba(110, 168, 255, 0.45);
	}
</style>
