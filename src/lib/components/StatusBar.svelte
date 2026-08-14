<script lang="ts">
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { drivingLineLengthFeet } from '$lib/engine/courseStats';

	let activeDef = $derived(TOOL_DEFS.find((d) => d.tool === toolStore.activeTool));

	// Status message (multi-step progress) wins; otherwise the tool's first clause.
	let hint = $derived(
		toolStore.statusMessage ||
			(activeDef ? `${activeDef.label} — ${activeDef.description.split('.')[0]}` : '')
	);

	let lengthLabel = $derived(
		courseStore.course.drivingLine.length >= 2
			? `${drivingLineLengthFeet(courseStore.course).toFixed(0)} ft`
			: '—'
	);
</script>

<footer class="status-bar">
	<div class="hint" class:pulsing={!!toolStore.statusMessage}>
		{#if toolStore.statusMessage}<span class="dot"></span>{/if}
		<span class="hint-text">{hint}</span>
	</div>
	<div class="stats">
		<span class="stat"><span class="stat-label">Line</span> <span class="stat-value">{lengthLabel}</span></span>
		<span class="stat"><span class="stat-label">Cones</span> <span class="stat-value">{courseStore.course.cones.length}</span></span>
		<span class="stat"><span class="stat-label">Workers</span> <span class="stat-value">{courseStore.course.workers.length}</span></span>
		<span class="stat"><span class="stat-label">Zones</span> <span class="stat-value">{courseStore.course.workerZones.length}</span></span>
	</div>
</footer>

<style>
	.status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 28px;
		padding: 0 var(--space-3);
		background: var(--bg-base);
		border-top: 1px solid var(--border-subtle);
		flex-shrink: 0;
		gap: var(--space-4);
	}

	.hint {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
		min-width: 0;
	}

	.hint-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.pulsing .hint-text {
		color: var(--text-secondary);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		flex-shrink: 0;
		animation: pulse 1.2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}

	.stats {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-shrink: 0;
	}

	.stat {
		display: flex;
		align-items: baseline;
		gap: var(--space-1);
		font-size: var(--text-sm);
	}

	.stat-label {
		color: var(--text-dim);
		text-transform: uppercase;
		font-size: var(--text-xs);
		letter-spacing: 0.04em;
	}

	.stat-value {
		font-family: var(--font-mono);
		color: var(--text-secondary);
	}
</style>
