<script lang="ts">
	import { onMount } from 'svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { listMyCourses, loadCourse, deleteCourse, type SavedCourse } from '$lib/services/courseService';
	import { deserialize } from '$lib/engine/courseSerializer';
	import { isSupabaseConfigured } from '$lib/services/supabase';
	import { toastStore } from '$lib/stores/toastStore.svelte';
	import type { CourseData } from '$lib/types/course';
	import SectionHeader from './ui/SectionHeader.svelte';
	import EmptyState from './ui/EmptyState.svelte';
	import ConfirmDialog from './ui/ConfirmDialog.svelte';
	import Button from './ui/Button.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { onfitcourse, oncourseopened }: {
		onfitcourse?: (data: CourseData) => void;
		oncourseopened?: (course: SavedCourse) => void;
	} = $props();

	const configured = isSupabaseConfigured();

	let myCourses = $state<SavedCourse[]>([]);
	let isLoading = $state(false);
	let pendingDelete = $state<SavedCourse | null>(null);

	onMount(async () => {
		if (!configured) return;
		isLoading = true;
		myCourses = await listMyCourses();
		isLoading = false;
	});

	async function openCourse(id: string) {
		const saved = await loadCourse(id);
		if (!saved) {
			toastStore.error("Couldn't load your courses");
			return;
		}
		const data = deserialize(saved.data);
		courseStore.load(data);
		onfitcourse?.(data);
		oncourseopened?.(saved);
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		const id = pendingDelete.id;
		pendingDelete = null;
		const ok = await deleteCourse(id);
		if (ok) {
			myCourses = myCourses.filter((c) => c.id !== id);
		} else {
			toastStore.error('Delete failed');
		}
	}
</script>

{#if configured}
	<section>
		<SectionHeader title="My Courses" count={myCourses.length} />
		{#if isLoading}
			<div class="loading-text">Loading...</div>
		{:else if myCourses.length === 0}
			<EmptyState message="No saved courses" hint="Save & Share stores courses here" />
		{:else}
			<div class="course-list">
				{#each myCourses as c (c.id)}
					<div class="course-item">
						<button class="course-open" onclick={() => openCourse(c.id)}>
							<span class="course-title">{c.title}</span>
						</button>
						<Button
							variant="ghost"
							size="sm"
							icon
							label={`Delete "${c.title}"`}
							onclick={() => (pendingDelete = c)}
						>
							<Trash2 size={14} />
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}

{#if pendingDelete}
	<ConfirmDialog
		title="Delete course"
		message={`Delete "${pendingDelete.title}"? This can't be undone.`}
		confirmLabel="Delete"
		danger
		onconfirm={confirmDelete}
		oncancel={() => (pendingDelete = null)}
	/>
{/if}

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.loading-text {
		font-size: var(--text-sm);
		color: var(--text-dim);
	}

	.course-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.course-item {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.course-open {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--text-md);
		color: var(--text-secondary);
		cursor: pointer;
		text-align: left;
	}

	.course-open:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.course-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
