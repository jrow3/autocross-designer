<script lang="ts">
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { simStore } from '$lib/stores/simStore.svelte';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { splineLengthFeet } from '$lib/engine/courseStats';

	let activeDef = $derived(TOOL_DEFS.find((d) => d.tool === toolStore.activeTool));

	// Status message (multi-step progress) wins; otherwise the tool's first clause.
	let hint = $derived(
		toolStore.statusMessage ||
			(activeDef ? `${activeDef.label} — ${activeDef.description.split('.')[0]}` : '')
	);

	let lengthLabel = $derived.by(() => {
		if (simStore.result) return `${simStore.result.lengthFt.toFixed(0)} ft`;
		if (courseStore.course.drivingLine.length < 2) return '—';
		const len = splineLengthFeet(courseStore.course, mapStore.mode, mapStore.feetPerPixel ?? undefined);
		return len == null ? '—' : `${len.toFixed(0)} ft`;
	});

	let timeLabel = $derived(simStore.result ? `${simStore.result.timeSec.toFixed(1)} s` : '—');
</script>

<footer class="status-bar">
	<div class="hint" class:pulsing={!!toolStore.statusMessage}>
		{#if toolStore.statusMessage}<span class="dot"></span>{/if}
		<span class="hint-text">{hint}</span>
	</div>
	<div class="stats">
		<span class="stat"><span class="stat-label">Line</span> <span class="stat-value">{lengthLabel}</span></span>
		<span class="stat"><span class="stat-label">Est</span> <span class="stat-value">{timeLabel}</span></span>
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
		height: 34px;
		padding: 0 var(--space-4);
		background: var(--bg-surface);
		border-top: 1px solid var(--border-subtle);
		box-shadow: var(--edge-highlight);
		flex-shrink: 0;
		gap: var(--space-4);
	}

	.hint {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-md);
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
		gap: var(--space-2);
		font-size: var(--text-md);
	}

	.stat + .stat {
		padding-left: var(--space-4);
		border-left: 1px solid var(--border-subtle);
	}

	.stat-label {
		color: var(--text-dim);
		text-transform: uppercase;
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.06em;
	}

	.stat-value {
		font-family: var(--font-mono);
		color: var(--text-primary);
	}
</style>
