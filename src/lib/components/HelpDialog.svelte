<script lang="ts">
	import BaseDialog from './BaseDialog.svelte';
	import Button from './ui/Button.svelte';
	import { TOOL_DEFS, TOOL_SECTIONS } from '$lib/config/tools';
	import { TOOL_SHORTCUTS } from '$lib/config/shortcuts';

	let { onclose }: { onclose: () => void } = $props();

	const toolShortcuts = TOOL_DEFS.filter((d) => TOOL_SHORTCUTS[d.tool] && d.tool !== 'select').map(
		(d) => ({ key: TOOL_SHORTCUTS[d.tool]!, label: d.label })
	);

	const staticShortcuts: { key: string; label: string }[] = [
		{ key: 'Esc', label: 'Switch to Select tool' },
		{ key: 'Ctrl+Z', label: 'Undo' },
		{ key: 'Ctrl+Y', label: 'Redo' },
		{ key: 'Ctrl+A', label: 'Select all' },
		{ key: 'Del', label: 'Delete selected' }
	];

	function sectionTools(section: string) {
		return TOOL_DEFS.filter((d) => d.section === section);
	}
</script>

<BaseDialog title="Help — Autocross Course Designer" {onclose} size="lg">
	{#snippet children()}
		<div class="help-content">
			{#each TOOL_SECTIONS as section (section.key)}
				<section>
					<h3>{section.label}</h3>
					<dl>
						{#each sectionTools(section.key) as def (def.tool)}
							<dt>{def.label}{def.imageModeOnly ? ' *' : ''}</dt>
							<dd>{def.description}</dd>
						{/each}
					</dl>
					{#if sectionTools(section.key).some((d) => d.imageModeOnly)}
						<p class="footnote">* Image mode only</p>
					{/if}
				</section>
			{/each}

			<section>
				<h3>Select Tool</h3>
				<dl>
					<dt>Box Select</dt><dd>Drag on the map to draw a selection box. All elements inside are selected (highlighted in blue).</dd>
					<dt>Group Move</dt><dd>Drag any selected element to move all selected items together.</dd>
					<dt>Right-click Pan</dt><dd>While sketching, right-click drag to pan the map without drawing.</dd>
				</dl>
			</section>

			<section>
				<h3>Keyboard Shortcuts</h3>
				<div class="shortcut-grid">
					{#each toolShortcuts as s (s.key)}
						<span class="key">{s.key}</span><span>{s.label}</span>
					{/each}
					{#each staticShortcuts as s (s.key)}
						<span class="key">{s.key}</span><span>{s.label}</span>
					{/each}
				</div>
			</section>

			<section>
				<h3>File Operations</h3>
				<dl>
					<dt>Save & Share</dt><dd>Save the course to the cloud and get a shareable link.</dd>
					<dt>Export / Import</dt><dd>Download or load courses as JSON files, from the File menu.</dd>
					<dt>SVG</dt><dd>Export the course as an SVG vector image.</dd>
					<dt>Print / PDF</dt><dd>Print or save the course as a PNG or PDF. Use Map Fade to improve contrast.</dd>
				</dl>
			</section>
		</div>
	{/snippet}
	{#snippet actions()}
		<Button variant="primary" onclick={onclose}>Close</Button>
	{/snippet}
</BaseDialog>

<style>
	.help-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.help-content section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.help-content h3 {
		font-size: var(--text-md);
		font-weight: 700;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-bottom: 1px solid var(--border);
		padding-bottom: var(--space-1);
	}

	.help-content dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-1) var(--space-3);
		margin: 0;
	}

	.help-content dt {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--accent-light);
	}

	.help-content dd {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	.footnote {
		font-size: var(--text-xs);
		color: var(--text-dim);
	}

	.shortcut-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-1) var(--space-3);
	}

	.key {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		background: var(--bg-base);
		padding: 1px 5px;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		text-align: center;
		border: 1px solid var(--border);
	}

	.shortcut-grid span:not(.key) {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
