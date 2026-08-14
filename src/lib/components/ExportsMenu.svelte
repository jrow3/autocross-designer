<script lang="ts">
	import Menu from './ui/Menu.svelte';
	import FileDown from '@lucide/svelte/icons/file-down';
	import Download from '@lucide/svelte/icons/download';
	import FileImage from '@lucide/svelte/icons/file-image';
	import Printer from '@lucide/svelte/icons/printer';
	import Upload from '@lucide/svelte/icons/upload';
	import LayoutTemplate from '@lucide/svelte/icons/layout-template';

	let {
		onexport,
		onimport,
		onprint,
		onexportsvg,
		onnewtemplate
	}: {
		onexport: () => void;
		onimport: () => void;
		onprint: () => void;
		onexportsvg: () => void;
		onnewtemplate: () => void;
	} = $props();
</script>

{#snippet templateIcon()}<LayoutTemplate size={14} />{/snippet}
{#snippet exportIcon()}<Download size={14} />{/snippet}
{#snippet svgIcon()}<FileImage size={14} />{/snippet}
{#snippet printIcon()}<Printer size={14} />{/snippet}
{#snippet importIcon()}<Upload size={14} />{/snippet}

<Menu
	label="File"
	items={[
		{ label: 'New from template…', icon: templateIcon, onselect: onnewtemplate },
		{ label: 'Export course (.json)', icon: exportIcon, onselect: onexport },
		{ label: 'Export SVG (.svg)', icon: svgIcon, onselect: onexportsvg },
		{ label: 'Print / PDF…', icon: printIcon, onselect: onprint },
		{ label: 'Import course (.json)', icon: importIcon, onselect: onimport }
	]}
>
	{#snippet icon()}<FileDown size={14} />{/snippet}
</Menu>
