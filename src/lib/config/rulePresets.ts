import type { RuleConfig } from '$lib/engine/rules/types';

export type RulePresetId = 'regional' | 'national';

// Advisory thresholds in the spirit of the SCCA Solo rulebook — the rulebook
// deliberately avoids mandating site dimensions, so these are guidance, not law.
export const RULE_PRESETS: Record<RulePresetId, RuleConfig> = {
	regional: {
		minGateWidthFt: 14,
		maxSpeedMph: 65,
		minCourseLengthFt: 1500,
		maxCourseLengthFt: 4200,
		finishRunoutFt: 150,
		coneBudget: 300,
		slalomSpacingTolerancePct: 20,
		targetTimeSec: 60,
		crossoverSeverity: 'info'
	},
	national: {
		minGateWidthFt: 15,
		maxSpeedMph: 65,
		minCourseLengthFt: 2100,
		maxCourseLengthFt: 4200,
		finishRunoutFt: 200,
		coneBudget: 350,
		slalomSpacingTolerancePct: 15,
		targetTimeSec: 60,
		crossoverSeverity: 'warn'
	}
};
