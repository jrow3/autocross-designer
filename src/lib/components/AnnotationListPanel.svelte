<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import SectionHeader from './ui/SectionHeader.svelte';
	import EmptyState from './ui/EmptyState.svelte';
	import Button from './ui/Button.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';

	let isExpanded = $state(true);

	function flyTo(lngLat: [number, number]) {
		mapStore.map?.flyTo({ center: lngLat, speed: 2 });
	}

	function truncate(text: string, max: number): string {
		return text.length > max ? text.substring(0, max) + '...' : text;
	}
</script>

{#if modeStore.activeMode === 'annotate'}
	<div
		class="annotation-panel"
		class:collapsed={!isExpanded}
		class:below-search={mapStore.mode === 'map'}
	>
		<div class="panel-header">
			<span class="panel-title">Notes & Workers</span>
			<Button
				variant="ghost"
				size="sm"
				icon
				label={isExpanded ? 'Collapse annotations panel' : 'Expand annotations panel'}
				onclick={() => (isExpanded = !isExpanded)}
			>
				{#if isExpanded}
					<ChevronUp size={16} />
				{:else}
					<ChevronDown size={16} />
				{/if}
			</Button>
		</div>

		{#if isExpanded}
			<div class="panel-body">
				<section>
					<SectionHeader title="Notes" count={courseStore.course.notes.length} />
					{#if courseStore.course.notes.length === 0}
						<EmptyState
							message="No notes yet"
							hint="Press 1 in Annotate or pick Note pin to annotate the course"
						/>
					{:else}
						<div class="item-list">
							{#each courseStore.course.notes as note (note.id)}
								<button class="list-item" onclick={() => flyTo(note.lngLat as [number, number])}>
									<span class="item-badge badge-note">{note.number}</span>
									<span class="item-text">{truncate(note.text, 30)}</span>
								</button>
							{/each}
						</div>
					{/if}
				</section>

				<section>
					<SectionHeader title="Workers" count={courseStore.course.workers.length} />
					{#if courseStore.course.workers.length === 0}
						<EmptyState
							message="No worker stations"
							hint="Press 3 in Annotate or pick Worker station to place one"
						/>
					{:else}
						<div class="item-list">
							{#each courseStore.course.workers as worker (worker.id)}
								<button class="list-item" onclick={() => flyTo(worker.lngLat as [number, number])}>
									<span class="item-badge badge-worker">{worker.number}</span>
									<span class="item-text">{worker.name ?? `Station ${worker.number}`}</span>
								</button>
							{/each}
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</div>
{/if}

<style>
	.annotation-panel {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		width: 240px;
		max-height: calc(100% - var(--space-4));
		display: flex;
		flex-direction: column;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: calc(var(--z-map-ui) + 1);
	}

	.annotation-panel.collapsed {
		width: auto;
	}

	/* the geocoder search control sits top-right in live-map mode */
	.annotation-panel.below-search {
		top: calc(var(--space-2) + 44px);
		max-height: calc(100% - var(--space-4) - 44px);
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-1) var(--space-1) var(--space-3);
		flex-shrink: 0;
	}

	.panel-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.panel-body {
		padding: 0 var(--space-3) var(--space-3);
		overflow-y: auto;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	section:last-child {
		margin-bottom: 0;
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-md);
		color: var(--text-secondary);
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.list-item:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.item-badge {
		width: 20px;
		height: 20px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: bold;
		color: #fff;
		flex-shrink: 0;
	}

	.badge-note {
		background: var(--note);
	}

	.badge-worker {
		background: var(--worker);
	}

	.item-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
