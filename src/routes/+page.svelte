<script lang="ts">
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import MapContainer from '$lib/components/MapContainer.svelte';
	import ToolStatus from '$lib/components/ToolStatus.svelte';
	import OnboardingHints from '$lib/components/OnboardingHints.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SaveShareDialog from '$lib/components/SaveShareDialog.svelte';
	import PrintDialog from '$lib/components/PrintDialog.svelte';
	import HelpDialog from '$lib/components/HelpDialog.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { deserialize } from '$lib/engine/courseSerializer';
	import { exportJSON, importJSON } from '$lib/services/jsonExport';
	import { downloadSVG } from '$lib/engine/svgExport';
	import type { SavedCourse } from '$lib/services/courseService';

	let mapContainer = $state<MapContainer>();

	let showSaveDialog = $state(false);
	let showPrintDialog = $state(false);
	let showHelpDialog = $state(false);
	let activeCourse = $state<SavedCourse | null>(null);
	let fileInput: HTMLInputElement;

	async function handleImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const data = deserialize(await importJSON(file));
		courseStore.load(data);
		mapContainer?.fitBoundsToCourse(data);
		(e.target as HTMLInputElement).value = '';
	}
</script>

<div class="app-shell">
	<Toolbar />
	<main class="map-area">
		<ActionBar
			onsave={() => (showSaveDialog = true)}
			onexport={() => exportJSON(courseStore.course)}
			onimport={() => fileInput.click()}
			onprint={() => (showPrintDialog = true)}
			onexportsvg={() => downloadSVG(courseStore.course)}
			onhelp={() => (showHelpDialog = true)}
		/>
		<div class="map-wrapper">
			<MapContainer bind:this={mapContainer} />
			<ToolStatus />
			<OnboardingHints />
		</div>
	</main>
	<Sidebar
		onfitcourse={(data) => mapContainer?.fitBoundsToCourse(data)}
		oncourseopened={(course) => activeCourse = course}
	/>
</div>

{#if showSaveDialog}
	<SaveShareDialog
		existingCourse={activeCourse}
		onclose={() => (showSaveDialog = false)}
		onsaved={(course) => activeCourse = course}
	/>
{/if}

{#if showPrintDialog}
	<PrintDialog onclose={() => (showPrintDialog = false)} />
{/if}

{#if showHelpDialog}
	<HelpDialog onclose={() => (showHelpDialog = false)} />
{/if}

<input type="file" accept=".json" bind:this={fileInput} onchange={handleImport} style="display:none" />

<style>
	.app-shell {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	.map-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.map-wrapper {
		flex: 1;
		position: relative;
		display: flex;
	}

</style>
