<script lang="ts">
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import ModeSwitcher from './ModeSwitcher.svelte';
	import ViewPanel from './ViewPanel.svelte';
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

<header class="top-bar">
	<div class="brand-group">
		<span class="brand">Autocross Designer</span>
	</div>
	<div class="center-group">
		<ModeSwitcher />
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
</header>

<style>
	.top-bar {
		display: flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		border-bottom: 1px solid var(--border);
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
</style>
