import type { RuleContext, RuleDef, RuleFinding } from './types';
import { startFinishRule, gateWidthRule } from './gateRules';
import { crossoverRule, courseLengthRule } from './pathRules';
import { hazardBufferRule, coneBudgetRule, slalomConsistencyRule } from './safetyRules';
import { maxSpeedRule, finishRunoutRule, straightIntoCornerRule, targetTimeRule } from './speedRules';

export const ALL_RULES: RuleDef[] = [
	startFinishRule,
	gateWidthRule,
	crossoverRule,
	courseLengthRule,
	hazardBufferRule,
	coneBudgetRule,
	slalomConsistencyRule,
	maxSpeedRule,
	finishRunoutRule,
	straightIntoCornerRule,
	targetTimeRule
];

export function evaluateAll(ctx: RuleContext, enabled: Record<string, boolean>): RuleFinding[] {
	const findings: RuleFinding[] = [];
	for (const rule of ALL_RULES) {
		if (enabled[rule.id] === false) continue;
		if (rule.requiresSim && !ctx.sim) continue;
		try {
			findings.push(...rule.evaluate(ctx));
		} catch (error) {
			// one bad rule never kills the panel
			findings.push({
				ruleId: rule.id,
				severity: 'info',
				message: `The "${rule.label}" check failed to run: ${error instanceof Error ? error.message : String(error)}`,
				relatedIds: [],
				location: null
			});
		}
	}
	return findings;
}
