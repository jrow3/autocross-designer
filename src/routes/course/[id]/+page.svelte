<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { loadCourse } from '$lib/services/courseService';
	import { deserialize } from '$lib/engine/courseSerializer';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import CourseViewer from '$lib/components/CourseViewer.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import MapPinned from '@lucide/svelte/icons/map-pinned';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	let loading = $state(true);
	let error = $state('');
	let title = $state('');

	onMount(async () => {
		try {
			const id = page.params.id as string;
			const result = await loadCourse(id);
			if (!result) {
				error = 'Course not found';
				loading = false;
				return;
			}
			title = result.title;
			const data = deserialize(result.data);
			courseStore.load(data);
			loading = false;
		} catch (e) {
			error = 'Failed to load course';
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="page-state">
		<EmptyState message="Loading course...">
			{#snippet icon()}<MapPinned size={20} />{/snippet}
		</EmptyState>
	</div>
{:else if error}
	<div class="page-state error">
		<EmptyState
			message={error}
			hint="The share link may be incorrect, or the course may have been deleted."
		>
			{#snippet icon()}<CircleAlert size={20} />{/snippet}
		</EmptyState>
	</div>
{:else}
	<CourseViewer {title} />
{/if}

<style>
	.page-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background: var(--bg-base);
	}

	.error :global(.icon) {
		color: var(--danger);
		opacity: 1;
	}
</style>
