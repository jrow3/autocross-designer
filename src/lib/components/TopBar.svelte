<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { reMirror } from '$lib/interactions/mirrorFlow.svelte';
	import ModeSwitcher from './ModeSwitcher.svelte';
	import FlipHorizontal2 from '@lucide/svelte/icons/flip-horizontal-2';
	import ViewPanel from './ViewPanel.svelte';
	import ExportsMenu from './ExportsMenu.svelte';
	import Button from './ui/Button.svelte';
	import { tooltip } from './ui/tooltip';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Redo2 from '@lucide/svelte/icons/redo-2';
	import CircleHelp from '@lucide/svelte/icons/circle-help';

	let {
		onsave,
		onexport,
		onimport,
		onprint,
		onexportsvg,
		onhelp,
		onnewtemplate
	}: {
		onsave: () => void;
		onexport: () => void;
		onimport: () => void;
		onprint: () => void;
		onexportsvg: () => void;
		onhelp: () => void;
		onnewtemplate: () => void;
	} = $props();
</script>

<header class="top-bar">
	<div class="brand-group">
		<span class="brand">Autocross Course Designer</span>
	</div>
	<div class="center-group">
		<ModeSwitcher />
		{#if courseStore.course.prosolo}
			<button
				class="prosolo-badge"
				use:tooltip={{ text: 'ProSolo course — click to re-mirror after edits', placement: 'bottom' }}
				onclick={reMirror}
			>
				<FlipHorizontal2 size={12} />
				ProSolo
			</button>
		{/if}
	</div>
	<div class="action-group">
		<span class="tip-host" use:tooltip={{ text: 'Undo', shortcut: 'Ctrl+Z', placement: 'bottom' }}>
			<Button
				variant="ghost"
				size="sm"
				icon
				label="Undo (Ctrl+Z)"
				disabled={!courseStore.canUndo}
				onclick={() => courseStore.undo()}
			>
				<Undo2 size={16} />
			</Button>
		</span>
		<span class="tip-host" use:tooltip={{ text: 'Redo', shortcut: 'Ctrl+Y', placement: 'bottom' }}>
			<Button
				variant="ghost"
				size="sm"
				icon
				label="Redo (Ctrl+Y)"
				disabled={!courseStore.canRedo}
				onclick={() => courseStore.redo()}
			>
				<Redo2 size={16} />
			</Button>
		</span>
		<span class="tip-host" use:tooltip={{ text: 'Help & shortcuts', placement: 'bottom' }}>
			<Button variant="ghost" size="sm" icon label="Help & shortcuts" onclick={onhelp}>
				<CircleHelp size={16} />
			</Button>
		</span>
		<div class="separator"></div>
		<ViewPanel />
		<ExportsMenu {onexport} {onexportsvg} {onprint} {onimport} {onnewtemplate} />
		<Button variant="primary" size="sm" onclick={onsave}>Save & Share</Button>
	</div>
</header>

<style>
	.top-bar {
		display: flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-base);
		border-bottom: 1px solid var(--border-subtle);
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.brand-group {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.brand {
		font-size: var(--text-md);
		font-weight: 650;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.center-group {
		display: flex;
		justify-content: center;
	}

	.action-group {
		flex: 1;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: var(--space-1);
	}

	.tip-host {
		display: inline-flex;
	}

	.separator {
		width: 1px;
		height: 20px;
		background: var(--border);
		margin: 0 var(--space-1);
	}

	.prosolo-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-left: var(--space-2);
		padding: 2px var(--space-2);
		background: var(--accent-dim);
		color: var(--accent);
		border: none;
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: 600;
		cursor: pointer;
	}

	.prosolo-badge:hover {
		filter: brightness(1.2);
	}
</style>
