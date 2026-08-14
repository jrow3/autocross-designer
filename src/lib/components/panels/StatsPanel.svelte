<script lang="ts">
	import { simStore } from '$lib/stores/simStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { CAR_PROFILES } from '$lib/config/carProfiles';
	import { splineLengthFeet } from '$lib/engine/courseStats';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import EmptyState from '../ui/EmptyState.svelte';

	let sim = $derived(simStore.result);

	let lengthLabel = $derived.by(() => {
		if (sim) return `${sim.lengthFt.toFixed(0)} ft`;
		const len = splineLengthFeet(courseStore.course, mapStore.mode, mapStore.feetPerPixel ?? undefined);
		return len ? `${len.toFixed(0)} ft` : '—';
	});
</script>

<div class="stats-panel">
	<section>
		<label class="profile-row">
			<span>Car class</span>
			<select
				value={simStore.profileId}
				onchange={(e) => simStore.setProfile((e.target as HTMLSelectElement).value)}
			>
				{#each CAR_PROFILES as profile (profile.id)}
					<option value={profile.id}>{profile.label}</option>
				{/each}
			</select>
		</label>

		{#if simStore.status === 'no-line'}
			<EmptyState
				message="No driving line yet"
				hint="Draw a driving line (Annotate mode) to estimate run time and speeds."
			/>
		{:else if simStore.status === 'needs-scale'}
			<EmptyState
				message="Image scale not calibrated"
				hint="Use Calibrate scale in Venue mode so distances are real feet."
			/>
		{:else if sim}
			<div class="stat-row"><span>Length</span><span class="value">{sim.lengthFt.toFixed(0)} ft</span></div>
			<div class="stat-row"><span>Est. run</span><span class="value">{sim.timeSec.toFixed(1)} s</span></div>
			<div class="stat-row"><span>Avg speed</span><span class="value">{sim.avgSpeedMph.toFixed(0)} mph</span></div>
			<div class="stat-row"><span>Max speed</span><span class="value">{sim.maxSpeedMph.toFixed(0)} mph</span></div>
			<div class="stat-row"><span>Slowest</span><span class="value">{sim.minSpeedMph.toFixed(0)} mph</span></div>
		{:else}
			<div class="computing">Computing…</div>
		{/if}
	</section>

	<section>
		<SectionHeader title="Course" />
		<div class="stat-row"><span>Driving line</span><span class="value">{lengthLabel}</span></div>
		<div class="stat-row"><span>Cones</span><span class="value">{courseStore.course.cones.length}</span></div>
		<div class="stat-row"><span>Workers</span><span class="value">{courseStore.course.workers.length}</span></div>
		<div class="stat-row"><span>Corner stations</span><span class="value">{courseStore.course.workerZones.length}</span></div>
		<div class="stat-row"><span>Hazards</span><span class="value">{courseStore.course.hazardMarkers.length}</span></div>
	</section>
</div>

<style>
	.stats-panel {
		display: flex;
		flex-direction: column;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	section + section {
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--border-subtle);
	}

	.profile-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		font-size: var(--text-md);
		color: var(--text-secondary);
	}

	.profile-row select {
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		padding: 2px var(--space-1);
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

	.computing {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}
</style>
