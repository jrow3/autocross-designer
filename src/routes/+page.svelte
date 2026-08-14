<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import ToolRail from '$lib/components/ToolRail.svelte';
	import EditorCanvas from '$lib/components/canvas/EditorCanvas.svelte';
	import OnboardingHints from '$lib/components/OnboardingHints.svelte';
	import VenuePanel from '$lib/components/VenuePanel.svelte';
	import AnnotationListPanel from '$lib/components/AnnotationListPanel.svelte';
	import PanelDock from '$lib/components/PanelDock.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import SaveShareDialog from '$lib/components/SaveShareDialog.svelte';
	import PrintDialog from '$lib/components/PrintDialog.svelte';
	import HelpDialog from '$lib/components/HelpDialog.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { deserialize } from '$lib/engine/courseSerializer';
	import { exportJSON, importJSON } from '$lib/services/jsonExport';
	import { downloadSVG } from '$lib/engine/svgExport';
	import type { SavedCourse } from '$lib/services/courseService';

	let editorCanvas = $state<EditorCanvas>();

	let showSaveDialog = $state(false);
	let showPrintDialog = $state(false);
	let showHelpDialog = $state(false);
	let showVenuePanel = $state(false);
	let activeCourse = $state<SavedCourse | null>(null);
	let fileInput: HTMLInputElement;

	async function handleImport(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const data = deserialize(await importJSON(file));
		courseStore.load(data);
		editorCanvas?.fitBoundsToCourse(data);
		(e.target as HTMLInputElement).value = '';
	}
</script>

<div class="app-shell">
	<TopBar
		onsave={() => (showSaveDialog = true)}
		onexport={() => exportJSON(courseStore.course)}
		onimport={() => fileInput.click()}
		onprint={() => (showPrintDialog = true)}
		onexportsvg={() => downloadSVG(courseStore.course)}
		onhelp={() => (showHelpDialog = true)}
	/>
	<div class="main-row">
		<ToolRail onloadvenue={() => (showVenuePanel = true)} />
		<div class="map-wrapper">
			<EditorCanvas bind:this={editorCanvas} />
			<OnboardingHints />
			{#if showVenuePanel}
				<VenuePanel onclose={() => (showVenuePanel = false)} />
			{/if}
			<AnnotationListPanel />
		</div>
		<PanelDock
			onsave={() => (showSaveDialog = true)}
			onexport={() => exportJSON(courseStore.course)}
			onimport={() => fileInput.click()}
			onprint={() => (showPrintDialog = true)}
			onexportsvg={() => downloadSVG(courseStore.course)}
			onfitcourse={(data) => editorCanvas?.fitBoundsToCourse(data)}
			oncourseopened={(course) => (activeCourse = course)}
		/>
	</div>
	<StatusBar />
</div>

{#if showSaveDialog}
	<SaveShareDialog
		existingCourse={activeCourse}
		onclose={() => (showSaveDialog = false)}
		onsaved={(course) => (activeCourse = course)}
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
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.main-row {
		flex: 1;
		display: flex;
		overflow: hidden;
		background: var(--bg-base);
	}

	.map-wrapper {
		flex: 1;
		position: relative;
		display: flex;
		margin: var(--space-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
</style>
