<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { drivingLineLengthFeet } from '$lib/engine/courseStats';
	import type { SavedCourse } from '$lib/services/courseService';
	import type { CourseData } from '$lib/types/course';
	import VenueList from './VenueList.svelte';
	import SidebarDisplayPanel from './SidebarDisplayPanel.svelte';
	import MyCourses from './MyCourses.svelte';
	import SectionHeader from './ui/SectionHeader.svelte';
	import EmptyState from './ui/EmptyState.svelte';
	import Button from './ui/Button.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { onfitcourse, oncourseopened }: {
		onfitcourse?: (data: CourseData) => void;
		oncourseopened?: (course: SavedCourse) => void;
	} = $props();

	let collapsed = $state(false);

	function coneCount(): number {
		return courseStore.course.cones.length;
	}

	function lineLength(): string {
		if (courseStore.course.drivingLine.length < 2) return '-- ft';
		return `${drivingLineLengthFeet(courseStore.course).toFixed(0)} ft`;
	}

	function flyTo(lngLat: [number, number]) {
		mapStore.map?.flyTo({ center: lngLat, speed: 2 });
	}

	function truncate(text: string, max: number): string {
		return text.length > max ? text.substring(0, max) + '...' : text;
	}
</script>

<aside class="sidebar" class:collapsed>
	<div class="sidebar-toggle">
		<Button
			variant="ghost"
			size="sm"
			icon
			label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			onclick={() => (collapsed = !collapsed)}
		>
			{#if collapsed}
				<ChevronLeft size={16} />
			{:else}
				<ChevronRight size={16} />
			{/if}
		</Button>
	</div>

	{#if !collapsed}
		<div class="sidebar-content">
			<section>
				<SectionHeader title="Course Info" />
				<div class="info-row">Cones: {coneCount()}</div>
				<div class="info-row">Line: {lineLength()}</div>
			</section>

			<SidebarDisplayPanel />

			<section>
				<SectionHeader title="Notes" count={courseStore.course.notes.length} />
				{#if courseStore.course.notes.length === 0}
					<EmptyState
						message="No notes yet"
						hint="Press 9 or pick Note to annotate the course"
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
						hint="Press W or pick Worker Station to place one"
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

			<MyCourses {onfitcourse} {oncourseopened} />

			<VenueList />
		</div>
	{/if}
</aside>

<style>
	.sidebar {
		width: 200px;
		background: var(--bg-base);
		border-left: 1px solid var(--bg-surface);
		display: flex;
		flex-direction: column;
		position: relative;
		transition: width 0.2s;
	}

	.sidebar.collapsed {
		width: 32px;
	}

	.sidebar-toggle {
		position: absolute;
		top: var(--space-1);
		left: var(--space-1);
		z-index: 1;
	}

	.sidebar-content {
		padding: var(--space-10) var(--space-3) var(--space-3);
		overflow-y: auto;
		flex: 1;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.info-row {
		font-size: var(--text-md);
		color: var(--text-secondary);
		padding: 0;
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
