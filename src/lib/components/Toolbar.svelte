<script lang="ts">
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { toolStore } from '$lib/stores/toolStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { layerStore } from '$lib/stores/layerStore.svelte';
	import { numberCones } from '$lib/engine/coneNumbering';
	import { TOOL_DEFS, TOOL_SECTIONS } from '$lib/config/tools';
	import ToolButton from './ToolButton.svelte';
	import SectionHeader from './ui/SectionHeader.svelte';
	import Button from './ui/Button.svelte';

	const STORAGE_KEY = 'toolbar-sections';

	function loadCollapsed(): Record<string, boolean> {
		let stored: Record<string, boolean> = {};
		try {
			stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
		} catch {
			/* fall through to defaults */
		}
		// Every key must be a defined boolean — bind:collapsed rejects undefined
		const out: Record<string, boolean> = {};
		for (const s of TOOL_SECTIONS) {
			out[s.key] = stored[s.key] ?? false;
		}
		return out;
	}

	let collapsed: Record<string, boolean> = $state(loadCollapsed());

	$effect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
	});

	let isHazardToolActive = $derived(
		toolStore.activeTool === 'hazard-point' || toolStore.activeTool === 'hazard-line'
	);

	function sectionTools(section: string) {
		return TOOL_DEFS.filter(
			(d) => d.section === section && (!d.imageModeOnly || mapStore.mode === 'image')
		);
	}

	function runConeNumbering() {
		const { cones, workerZones, drivingLine } = courseStore.course;
		if (workerZones.length === 0) {
			toolStore.setStatus('Draw worker zones first');
			return;
		}
		const numbers = numberCones(cones, workerZones, drivingLine);
		courseStore.pushUndo();
		courseStore.setConeNumbers(numbers);
		layerStore.setVisible('coneNumbers', true);
		toolStore.setStatus(`Numbered ${Object.keys(numbers).length} cones`);
	}

	function clearConeNumbers() {
		courseStore.pushUndo();
		courseStore.clearConeNumbers();
	}
</script>

<aside class="toolbar">
	{#each TOOL_SECTIONS as section (section.key)}
		<div class="toolbar-section">
			<SectionHeader title={section.label} collapsible bind:collapsed={collapsed[section.key]} />
			{#if !collapsed[section.key]}
				<div class="section-body">
					{#each sectionTools(section.key) as def (def.tool)}
						<ToolButton {def} />
						{#if def.tool === 'gate' && toolStore.activeTool === 'gate'}
							<div class="inline-settings">
								<label>
									<span>Width</span>
									<div class="inline-input-row">
										<input
											type="number"
											min="1"
											max="100"
											step="1"
											value={toolStore.gateWidthFeet}
											onchange={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (v > 0) toolStore.setGateWidth(v); }}
										/>
										<span class="inline-unit">ft</span>
									</div>
								</label>
								<label class="inline-checkbox">
									<input
										type="checkbox"
										checked={toolStore.gateDirectionalCones}
										onchange={(e) => toolStore.setGateDirectionalCones((e.target as HTMLInputElement).checked)}
									/>
									<span>Directional</span>
								</label>
							</div>
						{:else if def.tool === 'slalom' && toolStore.activeTool === 'slalom'}
							<div class="inline-settings">
								<label>
									<span>Spacing</span>
									<div class="inline-input-row">
										<input
											type="number"
											min="1"
											max="500"
											step="1"
											value={toolStore.slalomSpacingFeet}
											onchange={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (v > 0) toolStore.setSlalomSpacing(v); }}
										/>
										<span class="inline-unit">ft</span>
									</div>
								</label>
							</div>
						{/if}
					{/each}
					{#if section.key === 'safety' && isHazardToolActive}
						<div class="inline-settings">
							<label>
								<span>Buffer</span>
								<div class="inline-input-row">
									<input
										type="number"
										min="1"
										max="100"
										step="1"
										value={toolStore.hazardBufferFeet}
										onchange={(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (v > 0) toolStore.setHazardBufferFeet(v); }}
									/>
									<span class="inline-unit">ft</span>
								</div>
							</label>
						</div>
					{/if}
					{#if section.key === 'areas'}
						<div class="section-actions">
							<Button size="sm" variant="secondary" onclick={runConeNumbering}>Number Cones</Button>
							{#if Object.keys(courseStore.course.coneNumbers).length > 0}
								<Button size="sm" variant="secondary" onclick={clearConeNumbers}>Clear Numbers</Button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</aside>

<style>
	.toolbar {
		width: 180px;
		background: var(--bg-base);
		border-right: 1px solid var(--bg-surface);
		padding: var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		overflow-y: auto;
	}

	.toolbar-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.section-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding-left: var(--space-1);
		margin-bottom: var(--space-1);
	}

	.section-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-top: var(--space-1);
	}

	.inline-settings {
		padding: var(--space-1) var(--space-2);
		background: var(--bg-surface);
		border-radius: var(--radius-md);
		margin-left: var(--space-1);
	}

	.inline-settings label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.inline-input-row {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.inline-input-row input {
		width: 50px;
		padding: 2px var(--space-1);
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-size: var(--text-sm);
		text-align: center;
	}

	.inline-unit {
		font-size: var(--text-xs);
		color: var(--text-dim);
	}

	.inline-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-top: var(--space-1);
	}

	.inline-checkbox input {
		accent-color: var(--accent);
	}
</style>
