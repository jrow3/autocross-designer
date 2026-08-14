<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { selectionStore } from '$lib/stores/selectionStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { modeStore } from '$lib/stores/modeStore.svelte';
	import { UNIVERSAL_KEY_MAP, digitMapFor } from '$lib/config/shortcuts';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { dispatchCanvasKeys } from '$lib/interactions/keyScope';
	import Toast from '$lib/components/ui/Toast.svelte';

	let { children } = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		// Canvas-scoped keys (polygon close/cancel, sketch delete) run first.
		if (dispatchCanvasKeys(e)) return;

		if (e.key === 'Escape') {
			toolStore.setTool('select');
			return;
		}

		if (e.ctrlKey && e.key === 'z') {
			e.preventDefault();
			courseStore.undo();
			return;
		}

		if (e.ctrlKey && e.key === 'y') {
			e.preventDefault();
			courseStore.redo();
			return;
		}

		if (e.key === 'Delete') {
			selectionStore.deleteSelected();
			return;
		}

		if (e.ctrlKey && e.key === 'a') {
			e.preventDefault();
			selectionStore.selectAll();
			return;
		}

		if (e.ctrlKey || e.metaKey) return;

		const k = e.key.toLowerCase();
		const universalTool = UNIVERSAL_KEY_MAP[k];
		if (universalTool) {
			toolStore.setTool(universalTool);
			return;
		}

		const tool = digitMapFor(modeStore.activeMode)[k];
		if (tool) {
			const def = TOOL_DEFS.find((d) => d.tool === tool);
			if (def?.imageModeOnly && mapStore.mode !== 'image') return;
			toolStore.setTool(tool);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
	<link href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.3/mapbox-gl-geocoder.css" rel="stylesheet" />
	<title>Autocross Course Designer</title>
</svelte:head>

{@render children()}
<Toast />
