<script lang="ts">
	import BaseDialog from './BaseDialog.svelte';
	import Button from './ui/Button.svelte';
	import { MODES, type ModeId } from '$lib/config/modes';
	import { TOOL_DEFS } from '$lib/config/tools';
	import { shortcutLabel } from '$lib/config/shortcuts';

	let { onclose }: { onclose: () => void } = $props();

	function modeTools(id: ModeId) {
		return TOOL_DEFS.filter((d) => d.mode === id);
	}

	const universalTools = TOOL_DEFS.filter((d) => d.mode === 'universal');

	function universalKey(tool: string): string {
		return tool === 'select' ? 'V or Esc' : 'M';
	}

	const staticShortcuts: { key: string; label: string }[] = [
		{ key: 'Esc', label: 'Switch to Select tool' },
		{ key: 'Ctrl+Z', label: 'Undo' },
		{ key: 'Ctrl+Y', label: 'Redo' },
		{ key: 'Ctrl+A', label: 'Select all' },
		{ key: 'Del', label: 'Delete selected' }
	];
</script>

<BaseDialog title="Help — Autocross Course Designer" {onclose} size="lg">
	{#snippet children()}
		<div class="help-content">
			<p class="mode-note">
				Tools are grouped into modes — switch at the top of the screen. Anything already placed
				can be selected and edited in any mode.
			</p>
			{#each MODES as mode (mode.id)}
				<section>
					<h3>{mode.label}</h3>
					{#if modeTools(mode.id).length === 0}
						<p class="mode-note">No placement tools — review the finished course and share it.</p>
					{:else}
						<dl>
							{#each modeTools(mode.id) as def (def.tool)}
								<dt>
									<span class="key">{shortcutLabel(def.tool, mode.id)}</span>
									{def.label}{def.imageModeOnly ? ' *' : ''}
								</dt>
								<dd>{def.description}</dd>
							{/each}
						</dl>
						{#if modeTools(mode.id).some((d) => d.imageModeOnly)}
							<p class="footnote">* Image mode only</p>
						{/if}
					{/if}
				</section>
			{/each}

			<section>
				<h3>Universal — available in every mode</h3>
				<dl>
					{#each universalTools as def (def.tool)}
						<dt><span class="key">{universalKey(def.tool)}</span> {def.label}</dt>
						<dd>{def.description}</dd>
					{/each}
				</dl>
			</section>

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
					{#each staticShortcuts as s (s.key)}
						<span class="key">{s.key}</span><span>{s.label}</span>
					{/each}
					{#each universalTools as def (def.tool)}
						<span class="key">{universalKey(def.tool)}</span><span>{def.label}</span>
					{/each}
				</div>
				<p class="mode-note">Digit keys 1–9 activate that mode's tools, left to right:</p>
				{#each MODES as mode (mode.id)}
					{#if modeTools(mode.id).length > 0}
						<h4>{mode.label}</h4>
						<div class="shortcut-grid">
							{#each modeTools(mode.id) as def (def.tool)}
								<span class="key">{shortcutLabel(def.tool, mode.id)}</span><span>{def.label}</span>
							{/each}
						</div>
					{/if}
				{/each}
			</section>

			<section>
				<h3>File Operations</h3>
				<dl>
					<dt>Save & Share</dt><dd>Save the course to the cloud and get a shareable link.</dd>
					<dt>Export / Import</dt><dd>Download or load courses as JSON files — from the File menu, or the Check & Share panel.</dd>
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

	.help-content h4 {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-secondary);
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
		display: flex;
		align-items: baseline;
		gap: var(--space-1);
		white-space: nowrap;
	}

	.help-content dd {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	.footnote,
	.mode-note {
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
