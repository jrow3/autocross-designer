<script lang="ts">
	import { COURSE_TEMPLATES, type CourseTemplate } from '$lib/config/courseTemplates';
	import BaseDialog from './BaseDialog.svelte';
	import Button from './ui/Button.svelte';

	let {
		onpick,
		onclose
	}: {
		onpick: (template: CourseTemplate) => void;
		onclose: () => void;
	} = $props();

	// Fit the offsets into a 120x80 preview box
	function previewPoints(template: CourseTemplate): string {
		const xs = template.waypointOffsetsFt.map((p) => p[0]);
		const ys = template.waypointOffsetsFt.map((p) => p[1]);
		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);
		const scale = Math.min(110 / (maxX - minX || 1), 70 / (maxY - minY || 1));
		return template.waypointOffsetsFt
			.map((p) => `${(5 + (p[0] - minX) * scale).toFixed(1)},${(75 - (p[1] - minY) * scale).toFixed(1)}`)
			.join(' ');
	}

	function lengthFt(template: CourseTemplate): number {
		let total = 0;
		for (let i = 1; i < template.waypointOffsetsFt.length; i++) {
			const [ax, ay] = template.waypointOffsetsFt[i - 1];
			const [bx, by] = template.waypointOffsetsFt[i];
			total += Math.hypot(bx - ax, by - ay);
		}
		return total;
	}
</script>

<BaseDialog title="Start from a template" onclose={onclose} size="lg">
	{#snippet children()}
		<p class="explain">
			Templates drop a centerline at the current view — reshape it, then run the
			Generator to place cones on it.
		</p>
		<div class="template-grid">
			{#each COURSE_TEMPLATES as template (template.id)}
				<button class="template-card" onclick={() => onpick(template)}>
					<svg viewBox="0 0 120 80" class="preview">
						<polyline
							points={previewPoints(template)}
							fill="none"
							stroke="var(--driving-line)"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<span class="name">{template.label}</span>
					<span class="desc">{template.description}</span>
					<span class="length">~{Math.round(lengthFt(template) / 100) * 100} ft</span>
				</button>
			{/each}
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="secondary" onclick={onclose}>Cancel</Button>
	{/snippet}
</BaseDialog>

<style>
	.explain {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-bottom: var(--space-3);
	}

	.template-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: var(--space-3);
	}

	.template-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3);
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		color: var(--text-secondary);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.template-card:hover {
		border-color: var(--border-focus);
		box-shadow: var(--shadow-md);
	}

	.preview {
		width: 100%;
		aspect-ratio: 3/2;
		background: var(--bg-base);
		border-radius: var(--radius-md);
	}

	.name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: var(--text-md);
	}

	.desc {
		font-size: var(--text-sm);
		color: var(--text-muted);
		text-align: center;
		line-height: 1.3;
	}

	.length {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-dim);
	}
</style>
