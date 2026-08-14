<script lang="ts">
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import { MODES, type DockTab } from '$lib/config/modes';
	import { tooltip } from './ui/tooltip';
	import type { SavedCourse } from '$lib/services/courseService';
	import type { CourseData } from '$lib/types/course';
	import CoursePanel from './panels/CoursePanel.svelte';
	import StatsPanel from './panels/StatsPanel.svelte';
	import FindingsPanel from './panels/FindingsPanel.svelte';
	import GeneratorPanel from './panels/GeneratorPanel.svelte';
	import { ruleStore } from '$lib/stores/ruleStore.svelte';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import PanelRightClose from '@lucide/svelte/icons/panel-right-close';
	import PanelRightOpen from '@lucide/svelte/icons/panel-right-open';

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

	const TABS: { id: DockTab; label: string; designOnly?: boolean }[] = [
		{ id: 'findings', label: 'Findings' },
		{ id: 'stats', label: 'Stats' },
		{ id: 'generator', label: 'Generator', designOnly: true },
		{ id: 'course', label: 'Course' }
	];

	let collapsed = $state(false);
	let pickedTab = $state<DockTab | null>(null);

	let visibleTabs = $derived(TABS.filter((t) => !t.designOnly || modeStore.activeMode === 'design'));

	// The mode's default tab applies until the user picks one; a picked tab that
	// disappears (generator outside design mode) falls back to the default.
	let activeTab: DockTab = $derived.by(() => {
		const fallback = MODES.find((m) => m.id === modeStore.activeMode)?.defaultDockTab ?? 'course';
		if (pickedTab && visibleTabs.some((t) => t.id === pickedTab)) return pickedTab;
		return fallback;
	});
</script>

<aside class="panel-dock" class:collapsed>
	<div class="tab-strip">
		<button
			class="tab-btn collapse-btn"
			use:tooltip={{ text: collapsed ? 'Expand panel' : 'Collapse panel', placement: 'left' }}
			onclick={() => (collapsed = !collapsed)}
		>
			{#if collapsed}<PanelRightOpen size={16} />{:else}<PanelRightClose size={16} />{/if}
		</button>
		{#each visibleTabs as tab (tab.id)}
			<button
				class="tab-btn"
				class:active={!collapsed && activeTab === tab.id}
				use:tooltip={{ text: tab.label, placement: 'left' }}
				onclick={() => {
					pickedTab = tab.id;
					collapsed = false;
				}}
			>
				{#if tab.id === 'findings'}
					<ShieldCheck size={16} />
					{#if ruleStore.warnCount > 0}
						<span class="warn-badge">{ruleStore.warnCount}</span>
					{/if}
				{:else if tab.id === 'stats'}<BarChart3 size={16} />
				{:else if tab.id === 'generator'}<WandSparkles size={16} />
				{:else}<FolderOpen size={16} />{/if}
			</button>
		{/each}
	</div>

	{#if !collapsed}
		<div class="dock-body">
			{#if activeTab === 'course'}
				<CoursePanel {onsave} {onexport} {onimport} {onprint} {onexportsvg} {onfitcourse} {oncourseopened} />
			{:else if activeTab === 'findings'}
				<FindingsPanel />
			{:else if activeTab === 'stats'}
				<StatsPanel />
			{:else if activeTab === 'generator'}
				<GeneratorPanel />
			{/if}
		</div>
	{/if}
</aside>

<style>
	.panel-dock {
		display: flex;
		flex-shrink: 0;
		background: var(--bg-base);
		border-left: 1px solid var(--border-subtle);
	}

	.tab-strip {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-1);
		border-right: 1px solid var(--border-subtle);
	}

	.panel-dock.collapsed .tab-strip {
		border-right: none;
	}

	.tab-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		color: var(--text-muted);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background 0.12s ease, color 0.12s ease;
	}

	.tab-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.tab-btn.active {
		background: var(--accent-dim);
		color: var(--accent);
	}

	.collapse-btn {
		margin-bottom: var(--space-2);
	}

	.warn-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		min-width: 14px;
		height: 14px;
		padding: 0 3px;
		background: #f59e0b;
		color: #1a1a1a;
		border-radius: var(--radius-full);
		font-size: 9px;
		font-weight: 700;
		line-height: 14px;
		text-align: center;
	}

	.dock-body {
		width: 300px;
		padding: var(--space-3);
		overflow-y: auto;
	}
</style>
