<script lang="ts">
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { TOOL_DEFS } from '$lib/config/tools';

	let isMultiStep = $derived(
		TOOL_DEFS.find((d) => d.tool === toolStore.activeTool)?.multiStep ?? false
	);
</script>

{#if toolStore.statusMessage}
	<div class="tool-status">
		{#if isMultiStep}
			<span class="pulse-dot"></span>
		{/if}
		{toolStore.statusMessage}
	</div>
{/if}

<style>
	.tool-status {
		position: absolute;
		bottom: var(--space-4);
		left: var(--space-4);
		background: rgba(255, 255, 255, 0.95);
		color: var(--text-primary);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-md);
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 13px;
		pointer-events: none;
		z-index: var(--z-map-ui);
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 8px;
		backdrop-filter: blur(4px);
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-light);
		animation: pulse 1.5s ease-in-out infinite;
		flex-shrink: 0;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.7); }
	}
</style>
