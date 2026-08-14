<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { runGenerator } from '$lib/interactions/generateFlow.svelte';
	import type { GeneratedCourse, GeneratorOptions } from '$lib/engine/generator/courseGenerator';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import EmptyState from '../ui/EmptyState.svelte';
	import Button from '../ui/Button.svelte';
	import Dices from '@lucide/svelte/icons/dices';

	let seed = $state(Math.floor(Math.random() * 1e9));
	let eventType = $state<'regional' | 'national'>('regional');
	let biggerSweeper = $state(false);
	let widerGates = $state(false);
	let leanMode = $state(false);
	let lastRun = $state<GeneratedCourse | null>(null);

	let canGenerate = $derived(
		courseStore.course.drivingLine.length >= 2 &&
			(mapStore.mode !== 'image' || !!mapStore.feetPerPixel)
	);

	function options(): GeneratorOptions {
		return { seed, eventType, biggerSweeper, widerGates, leanMode };
	}

	function generate() {
		lastRun = runGenerator(options());
	}

	function reroll() {
		seed = Math.floor(Math.random() * 1e9);
		generate();
	}
</script>

<div class="generator-panel">
	<SectionHeader title="Course Generator" />
	<p class="explain">
		Draw a rough driving line, then generate — cones land on the straights and
		corners. Replaces generated cone types; walls and annotations stay.
	</p>

	{#if !canGenerate}
		<EmptyState
			message={courseStore.course.drivingLine.length < 2 ? 'No driving line yet' : 'Image scale not calibrated'}
			hint={courseStore.course.drivingLine.length < 2
				? 'Sketch the centerline with the Driving line tool first.'
				: 'Calibrate the image scale in Venue mode first.'}
		/>
	{:else}
		<label class="field">
			<span>Event level</span>
			<select bind:value={eventType}>
				<option value="regional">Regional</option>
				<option value="national">National</option>
			</select>
		</label>
		<label class="check"><input type="checkbox" bind:checked={biggerSweeper} /> <span>Big sweepers (1.5× corners)</span></label>
		<label class="check"><input type="checkbox" bind:checked={widerGates} /> <span>Wider gates (novice friendly)</span></label>
		<label class="check"><input type="checkbox" bind:checked={leanMode} /> <span>Lean mode (fewer cones)</span></label>

		<label class="field">
			<span>Seed</span>
			<input class="seed" type="number" bind:value={seed} />
		</label>

		<div class="actions">
			<Button variant="primary" onclick={generate}>Generate</Button>
			<Button variant="secondary" onclick={reroll}><Dices size={14} /> Reroll</Button>
		</div>

		{#if lastRun}
			<div class="result">
				<div class="stat-row"><span>Cones</span><span class="value">{lastRun.stats.coneCount}</span></div>
				<div class="stat-row"><span>Gates</span><span class="value">{lastRun.stats.gateCount}</span></div>
				<div class="stat-row"><span>Slaloms</span><span class="value">{lastRun.stats.slalomCount}</span></div>
				{#if lastRun.stats.sweeperCount > 0}
					<div class="stat-row"><span>Sweepers</span><span class="value">{lastRun.stats.sweeperCount}</span></div>
				{/if}
				{#each lastRun.warnings as warning, i (i)}
					<p class="warning">{warning}</p>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.generator-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.explain {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.4;
	}

	.field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		font-size: var(--text-md);
		color: var(--text-secondary);
	}

	.field select,
	.field input {
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		padding: 2px var(--space-1);
	}

	.seed {
		width: 110px;
		font-family: var(--font-mono);
	}

	.check {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		cursor: pointer;
	}

	.check input {
		accent-color: var(--accent-light);
	}

	.actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.result {
		margin-top: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-md);
		color: var(--text-secondary);
	}

	.value {
		font-family: var(--font-mono);
		color: var(--text-primary);
	}

	.warning {
		font-size: var(--text-sm);
		color: #f59e0b;
	}
</style>
