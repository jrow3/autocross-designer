<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { deleteVenue, loadVenues, saveVenues } from '$lib/services/courseService';
	import type { VenueData } from '$lib/types/course';
	import SectionHeader from './ui/SectionHeader.svelte';
	import EmptyState from './ui/EmptyState.svelte';
	import Button from './ui/Button.svelte';
	import SharedVenues from './SharedVenues.svelte';
	import { tooltip } from './ui/tooltip';
	import Save from '@lucide/svelte/icons/save';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let venues = $state<Record<string, VenueData>>(loadVenues());
	let newName = $state('');

	function saveCurrentVenue() {
		const name = newName.trim();
		if (!name) return;
		venues[name] = {
			obstacles: [...courseStore.course.obstacles],
			mapCenter: courseStore.course.mapCenter,
			mapZoom: courseStore.course.mapZoom,
			mode: 'map',
			imageFileName: courseStore.course.imageFileName ?? null
		};
		saveVenues(venues);
		newName = '';
	}

	function loadVenue(name: string) {
		const v = venues[name];
		if (!v) return;
		courseStore.pushUndo();
		for (const obs of v.obstacles) {
			courseStore.addObstacle({ ...obs, id: String(Date.now() + Math.random()) });
		}
		const map = mapStore.map;
		if (map && 'flyTo' in map) {
			map.flyTo({ center: v.mapCenter, zoom: v.mapZoom });
		}
		courseStore.setMapView(v.mapCenter, v.mapZoom);
	}

	function removeVenue(name: string) {
		delete venues[name];
		venues = { ...venues };
		deleteVenue(name);
	}
</script>

<SharedVenues />

<section>
	<SectionHeader title="Venues" count={Object.keys(venues).length} />
	<div class="venue-save">
		<input
			type="text"
			bind:value={newName}
			placeholder="Venue name..."
			aria-label="Venue name"
			onkeydown={(e) => e.key === 'Enter' && saveCurrentVenue()}
		/>
		<span class="tip-host" use:tooltip={{ text: 'Save the current map view as a venue' }}>
			<Button
				variant="secondary"
				size="sm"
				icon
				label="Save venue"
				disabled={!newName.trim()}
				onclick={saveCurrentVenue}
			>
				<Save size={14} />
			</Button>
		</span>
	</div>
	{#if Object.keys(venues).length === 0}
		<EmptyState message="No saved venues" hint="Name your lot to jump back to it later" />
	{:else}
		<div class="venue-list">
			{#each Object.keys(venues) as name (name)}
				<div class="venue-item">
					<button class="venue-load" onclick={() => loadVenue(name)}>{name}</button>
					<Button
						variant="ghost"
						size="sm"
						icon
						label={`Delete venue "${name}"`}
						onclick={() => removeVenue(name)}
					>
						<Trash2 size={14} />
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.venue-save {
		display: flex;
		gap: var(--space-1);
	}

	.venue-save input {
		flex: 1;
		min-width: 0;
		padding: 3px var(--space-2);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: var(--text-sm);
		outline: none;
	}

	.venue-save input:focus {
		border-color: var(--border-focus);
	}

	.tip-host {
		display: inline-flex;
	}

	.venue-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.venue-item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.venue-load {
		flex: 1;
		min-width: 0;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--text-md);
		cursor: pointer;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.venue-load:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
</style>
