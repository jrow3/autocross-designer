<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import type { LayerKey } from '$lib/stores/layerStore.svelte';
	import { drivingLineLengthFeet } from '$lib/engine/courseStats';
	import type { SavedCourse } from '$lib/services/courseService';
	import type { CourseData } from '$lib/types/course';
	import MyCourses from '../MyCourses.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import Button from '../ui/Button.svelte';
	import Download from '@lucide/svelte/icons/download';
	import FileImage from '@lucide/svelte/icons/file-image';
	import Printer from '@lucide/svelte/icons/printer';
	import Upload from '@lucide/svelte/icons/upload';

	let {
		onsave,
		onexport,
		onimport,
		onprint,
		onexportsvg,
		onfitcourse,
		oncourseopened
	}: {
		onsave: () => void;
		onexport: () => void;
		onimport: () => void;
		onprint: () => void;
		onexportsvg: () => void;
		onfitcourse?: (data: CourseData) => void;
		oncourseopened?: (course: SavedCourse) => void;
	} = $props();

	function lineLength(): string {
		if (courseStore.course.drivingLine.length < 2) return '-- ft';
		return `${drivingLineLengthFeet(courseStore.course).toFixed(0)} ft`;
	}

	function toggleLayer(key: LayerKey) {
		layerStore.toggle(key);
	}
</script>

<div class="course-panel">
	<section>
		<SectionHeader title="Course Stats" />
		<div class="stat-row"><span>Cones</span><span>{courseStore.course.cones.length}</span></div>
		<div class="stat-row"><span>Driving line</span><span>{lineLength()}</span></div>
		<div class="stat-row"><span>Workers</span><span>{courseStore.course.workers.length}</span></div>
		<div class="stat-row"><span>Notes</span><span>{courseStore.course.notes.length}</span></div>
		<div class="stat-row"><span>Hazards</span><span>{courseStore.course.hazardMarkers.length}</span></div>
		<div class="stat-row"><span>Staging areas</span><span>{courseStore.course.stagingAreas.length}</span></div>
		<div class="stat-row"><span>Corner stations</span><span>{courseStore.course.workerZones.length}</span></div>
	</section>

	<section>
		<SectionHeader title="What's Visible" />
		<div class="layers-list">
			{#each layerStore.layers as layer (layer.key)}
				<label class="layer-toggle">
					<input
						type="checkbox"
						checked={layer.visible}
						onchange={() => toggleLayer(layer.key)}
					/>
					<span>{layer.label}</span>
				</label>
			{/each}
		</div>
	</section>

	<section>
		<SectionHeader title="Actions" />
		<div class="action-list">
			<Button size="sm" onclick={onprint}><Printer size={14} /> Print / PDF…</Button>
			<Button size="sm" onclick={onexport}><Download size={14} /> Export .json</Button>
			<Button size="sm" onclick={onexportsvg}><FileImage size={14} /> Export .svg</Button>
			<Button size="sm" onclick={onimport}><Upload size={14} /> Import</Button>
			<Button variant="primary" onclick={onsave}>Save & Share</Button>
		</div>
	</section>

	<MyCourses {onfitcourse} {oncourseopened} />
</div>

<style>
	.course-panel {
		display: flex;
		flex-direction: column;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-md);
		color: var(--text-secondary);
	}

	.stat-row span:last-child {
		color: var(--text-primary);
		font-weight: 500;
	}

	.layers-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.layer-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 2px 0;
		font-size: var(--text-md);
		color: var(--text-secondary);
		cursor: pointer;
	}

	.layer-toggle input {
		width: 14px;
		height: 14px;
		accent-color: var(--accent-light);
	}

	.action-list {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-1);
	}
</style>
