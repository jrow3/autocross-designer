import { untrack } from 'svelte';
import { courseStore } from './courseStore.svelte';
import { mapStore } from './mapStore.svelte';
import { simStore } from './simStore.svelte';
import { evaluateAll } from '$lib/engine/rules';
import type { RuleConfig, RuleFinding } from '$lib/engine/rules/types';
import { RULE_PRESETS, type RulePresetId } from '$lib/config/rulePresets';

const DEBOUNCE_MS = 250;

let presetId = $state<RulePresetId>('regional');
let overrides = $state<Partial<RuleConfig>>({});
let enabled = $state<Record<string, boolean>>({});
let findings = $state<RuleFinding[]>([]);
let timer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function effectiveConfig(): RuleConfig {
	return { ...RULE_PRESETS[presetId], ...overrides };
}

function recompute(): void {
	findings = evaluateAll(
		{
			course: courseStore.course,
			sim: simStore.result,
			mode: mapStore.mode,
			feetPerPixel: mapStore.feetPerPixel ?? undefined,
			config: effectiveConfig()
		},
		enabled
	);
}

function schedule(): void {
	if (timer) clearTimeout(timer);
	timer = setTimeout(() => {
		timer = null;
		recompute();
	}, DEBOUNCE_MS);
}

export const ruleStore = {
	get findings() {
		return findings;
	},

	get presetId() {
		return presetId;
	},

	get config() {
		return effectiveConfig();
	},

	isEnabled(ruleId: string): boolean {
		return enabled[ruleId] !== false;
	},

	setPreset(id: RulePresetId): void {
		presetId = id;
		schedule();
	},

	toggleRule(ruleId: string): void {
		enabled[ruleId] = enabled[ruleId] === false;
		schedule();
	},

	get warnCount() {
		return findings.filter((f) => f.severity === 'warn').length;
	},

	init(): () => void {
		if (initialized) return () => {};
		initialized = true;
		const stop = $effect.root(() => {
			$effect(() => {
				// deep-track course content + everything else that feeds the rules
				const key = JSON.stringify(courseStore.course);
				void key;
				void simStore.result;
				void mapStore.mode;
				void mapStore.feetPerPixel;
				void presetId;
				untrack(() => schedule());
			});
		});
		return () => {
			initialized = false;
			if (timer) clearTimeout(timer);
			stop();
		};
	},

	// Test hook
	flushNow(): void {
		if (timer) clearTimeout(timer);
		timer = null;
		recompute();
	}
};
