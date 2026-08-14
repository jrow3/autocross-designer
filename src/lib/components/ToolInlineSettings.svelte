<script lang="ts">
	import { toolStore } from '$lib/stores/toolStore.svelte';

	let {
		anchor,
		placement = 'bottom'
	}: { anchor?: HTMLElement; placement?: 'bottom' | 'right' } = $props();

	let isHazardToolActive = $derived(
		toolStore.activeTool === 'hazard-point' || toolStore.activeTool === 'hazard-line'
	);

	let hasSettings = $derived(
		toolStore.activeTool === 'gate' || toolStore.activeTool === 'slalom' || isHazardToolActive
	);

	let popoverEl = $state<HTMLDivElement>();
	let pos = $state({ left: 0, top: 0 });

	function updatePosition() {
		if (!anchor) return;
		const rect = anchor.getBoundingClientRect();
		const width = popoverEl?.offsetWidth ?? 0;
		if (placement === 'right') {
			pos = {
				left: Math.min(rect.right + 8, window.innerWidth - width - 4),
				top: rect.top
			};
			return;
		}
		pos = {
			left: Math.max(4, Math.min(rect.left, window.innerWidth - width - 4)),
			top: rect.bottom + 6
		};
	}

	$effect(() => {
		if (!hasSettings || !anchor) return;
		updatePosition();
		// capture-phase scroll catches the toolbar's own overflow-x scrolling
		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);
		return () => {
			window.removeEventListener('resize', updatePosition);
			window.removeEventListener('scroll', updatePosition, true);
		};
	});
</script>

{#if hasSettings && anchor}
	<div
		class="tool-popover"
		bind:this={popoverEl}
		style="left: {pos.left}px; top: {pos.top}px"
	>
		{#if toolStore.activeTool === 'gate'}
			<label>
				<span>Width</span>
				<input
					type="number"
					min="1"
					max="100"
					step="1"
					value={toolStore.gateWidthFeet}
					onchange={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (v > 0) toolStore.setGateWidth(v); }}
				/>
				<span class="inline-unit">ft</span>
			</label>
			<label class="inline-checkbox">
				<input
					type="checkbox"
					checked={toolStore.gateDirectionalCones}
					onchange={(e) => toolStore.setGateDirectionalCones((e.target as HTMLInputElement).checked)}
				/>
				<span>Directional</span>
			</label>
		{:else if toolStore.activeTool === 'slalom'}
			<label>
				<span>Spacing</span>
				<input
					type="number"
					min="1"
					max="500"
					step="1"
					value={toolStore.slalomSpacingFeet}
					onchange={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (v > 0) toolStore.setSlalomSpacing(v); }}
				/>
				<span class="inline-unit">ft</span>
			</label>
		{:else if isHazardToolActive}
			<label>
				<span>Buffer</span>
				<input
					type="number"
					min="1"
					max="100"
					step="1"
					value={toolStore.hazardBufferFeet}
					onchange={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (v > 0) toolStore.setHazardBufferFeet(v); }}
				/>
				<span class="inline-unit">ft</span>
			</label>
		{/if}
	</div>
{/if}

<style>
	.tool-popover {
		position: fixed;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		z-index: var(--z-menu);
	}

	.tool-popover label {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-sm);
		color: var(--text-muted);
		white-space: nowrap;
	}

	.tool-popover input[type='number'] {
		width: 50px;
		padding: 2px var(--space-1);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-size: var(--text-sm);
		text-align: center;
	}

	.inline-unit {
		font-size: var(--text-xs);
		color: var(--text-dim);
	}

	.inline-checkbox input {
		accent-color: var(--accent);
	}
</style>
