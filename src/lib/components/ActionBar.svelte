<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import Button from './ui/Button.svelte';
	import Menu from './ui/Menu.svelte';
	import { tooltip } from './ui/tooltip';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Redo2 from '@lucide/svelte/icons/redo-2';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import FileDown from '@lucide/svelte/icons/file-down';
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
		onhelp
	}: {
		onsave: () => void;
		onexport: () => void;
		onimport: () => void;
		onprint: () => void;
		onexportsvg: () => void;
		onhelp: () => void;
	} = $props();
</script>

{#snippet exportIcon()}<Download size={14} />{/snippet}
{#snippet svgIcon()}<FileImage size={14} />{/snippet}
{#snippet printIcon()}<Printer size={14} />{/snippet}
{#snippet importIcon()}<Upload size={14} />{/snippet}

<div class="action-bar">
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
		<div class="separator"></div>
		<span class="tip-host" use:tooltip={{ text: 'Help & shortcuts', placement: 'bottom' }}>
			<Button variant="ghost" size="sm" icon label="Help & shortcuts" onclick={onhelp}>
				<CircleHelp size={16} />
			</Button>
		</span>
	</div>
	<div class="action-group">
		<Menu
			label="File"
			items={[
				{ label: 'Export course (.json)', icon: exportIcon, onselect: onexport },
				{ label: 'Export SVG (.svg)', icon: svgIcon, onselect: onexportsvg },
				{ label: 'Print / PDF…', icon: printIcon, onselect: onprint },
				{ label: 'Import course (.json)', icon: importIcon, onselect: onimport }
			]}
		>
			{#snippet icon()}<FileDown size={14} />{/snippet}
		</Menu>
		<Button variant="success" size="sm" onclick={onsave}>Save & Share</Button>
	</div>
</div>

<style>
	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		border-bottom: 1px solid var(--border);
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.action-group {
		display: flex;
		gap: var(--space-1);
		align-items: center;
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
</style>
