<script lang="ts">
	import { ruleStore } from '$lib/stores/ruleStore.svelte';
	import { courseStore } from '$lib/stores/courseStore.svelte';
	import { mapStore } from '$lib/stores/mapStore.svelte';
	import { selectionStore } from '$lib/stores/selectionStore.svelte';
	import { ALL_RULES } from '$lib/engine/rules';
	import type { RuleFinding } from '$lib/engine/rules/types';
	import type { RulePresetId } from '$lib/config/rulePresets';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import EmptyState from '../ui/EmptyState.svelte';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Info from '@lucide/svelte/icons/info';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

	let rulesCollapsed = $state(true);

	let sorted = $derived(
		[...ruleStore.findings].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'warn' ? -1 : 1))
	);

	function focusFinding(finding: RuleFinding) {
		const map = mapStore.map;
		if (finding.location && map && 'flyTo' in map) {
			map.flyTo({ center: finding.location as [number, number] });
		}
		selectionStore.clear();
		for (const id of finding.relatedIds) {
			if (courseStore.course.cones.some((c) => c.id === id)) selectionStore.select('cone', id);
			else if (courseStore.course.hazardMarkers.some((h) => h.id === id)) selectionStore.select('hazard', id);
		}
	}
</script>

<div class="findings-panel">
	<label class="preset-row">
		<span>Event level</span>
		<select
			value={ruleStore.presetId}
			onchange={(e) => ruleStore.setPreset((e.target as HTMLSelectElement).value as RulePresetId)}
		>
			<option value="regional">Regional</option>
			<option value="national">National</option>
		</select>
	</label>

	{#if sorted.length === 0}
		<EmptyState message="All checks clear" hint="Findings appear here as you design.">
			{#snippet icon()}<ShieldCheck size={20} />{/snippet}
		</EmptyState>
	{:else}
		<ul class="findings-list">
			{#each sorted as finding, i (i)}
				<li>
					<button class="finding" class:warn={finding.severity === 'warn'} onclick={() => focusFinding(finding)}>
						<span class="finding-icon">
							{#if finding.severity === 'warn'}<TriangleAlert size={14} />{:else}<Info size={14} />{/if}
						</span>
						<span class="finding-text">{finding.message}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<section class="rules-section">
		<SectionHeader title="Rules" collapsible bind:collapsed={rulesCollapsed} count={ALL_RULES.length} />
		{#if !rulesCollapsed}
			<div class="rules-list">
				{#each ALL_RULES as rule (rule.id)}
					<label class="rule-toggle" title={rule.description}>
						<input
							type="checkbox"
							checked={ruleStore.isEnabled(rule.id)}
							onchange={() => ruleStore.toggleRule(rule.id)}
						/>
						<span>{rule.label}</span>
					</label>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.findings-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.preset-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		font-size: var(--text-md);
		color: var(--text-secondary);
	}

	.preset-row select {
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		padding: 2px var(--space-1);
	}

	.findings-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.finding {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: var(--bg-base);
		border: 1px solid var(--border-subtle);
		border-left: 3px solid var(--text-dim);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--text-sm);
		text-align: left;
		cursor: pointer;
		transition: border-color 0.12s ease, background 0.12s ease;
	}

	.finding:hover {
		border-color: var(--border-focus);
		background: var(--bg-elevated);
	}

	.finding.warn {
		border-left-color: var(--warning);
	}

	.finding-icon {
		display: inline-flex;
		flex-shrink: 0;
		margin-top: 1px;
		color: var(--text-muted);
	}

	.finding.warn .finding-icon {
		color: var(--warning);
	}

	.finding-text {
		line-height: 1.35;
	}

	.rules-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.rules-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.rule-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		cursor: pointer;
	}

	.rule-toggle input {
		width: 13px;
		height: 13px;
		accent-color: var(--accent-light);
	}
</style>
