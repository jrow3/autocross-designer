import type { CourseData, LngLat } from '$lib/types/course';
import type { SimResult } from '../speedSim';

export type RuleSeverity = 'pass' | 'info' | 'warn';

export interface RuleFinding {
	ruleId: string;
	severity: RuleSeverity;
	message: string; // plain English, already formatted
	relatedIds: string[]; // cone/hazard/element ids for highlight
	location: LngLat | null; // zoom-to / on-map marker anchor
	value?: number; // measured value, for the panel
	limit?: number; // threshold it was compared against
}

export interface RuleConfig {
	minGateWidthFt: number;
	maxSpeedMph: number;
	minCourseLengthFt: number;
	maxCourseLengthFt: number;
	finishRunoutFt: number;
	coneBudget: number;
	slalomSpacingTolerancePct: number;
	targetTimeSec: number;
	crossoverSeverity: RuleSeverity;
}

export interface RuleContext {
	course: CourseData;
	sim: SimResult | null;
	mode: 'map' | 'image';
	feetPerPixel?: number;
	config: RuleConfig;
}

export interface RuleDef {
	id: string;
	label: string;
	description: string;
	requiresSim: boolean; // skipped with a note when sim is unavailable
	evaluate(ctx: RuleContext): RuleFinding[]; // pure
}
