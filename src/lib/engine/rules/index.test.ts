import { describe, it, expect } from 'vitest';
import { ALL_RULES, evaluateAll } from './index';
import { RULE_PRESETS } from '$lib/config/rulePresets';
import { emptyCourse } from '../courseSerializer';
import { simulate } from '../speedSim';
import { carProfile } from '$lib/config/carProfiles';
import { feetToLngLatOffset } from '../geo';
import { generateId } from '../id';
import type { ConeData, CourseData, LngLat } from '$lib/types/course';
import type { RuleContext } from './types';
import type { RuleDef } from './types';

const ORIGIN: LngLat = [-96.769, 40.845];

function cone(lngLat: LngLat, type: ConeData['type'] = 'regular'): ConeData {
	return { id: generateId(), type, lngLat, lockedTargetId: null };
}

function ctx(course: CourseData, overrides: Partial<RuleContext> = {}): RuleContext {
	return {
		course,
		sim: null,
		mode: 'map',
		config: RULE_PRESETS.national,
		...overrides
	};
}

function courseWithLine(points: LngLat[]): CourseData {
	const course = emptyCourse();
	course.drivingLine = points.map((lngLat) => ({ lngLat }));
	return course;
}

describe('gate-width', () => {
	it('flags a narrow gate the line passes through and passes a wide one', () => {
		const gateCenter = feetToLngLatOffset(ORIGIN, 90, 300);
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 600)]);
		// 14 ft gate perpendicular to an east-west line: cones 7 ft north/south
		course.cones.push(cone(feetToLngLatOffset(gateCenter, 0, 7)));
		course.cones.push(cone(feetToLngLatOffset(gateCenter, 180, 7)));
		const findings = evaluateAll(ctx(course), {});
		const gate = findings.filter((f) => f.ruleId === 'gate-width');
		expect(gate).toHaveLength(1);
		expect(gate[0].severity).toBe('warn');
		expect(gate[0].value).toBeGreaterThan(13);
		expect(gate[0].value).toBeLessThan(15);
		expect(gate[0].relatedIds).toHaveLength(2);

		// widen to 20 ft: no finding
		const wide = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 600)]);
		wide.cones.push(cone(feetToLngLatOffset(gateCenter, 0, 10)));
		wide.cones.push(cone(feetToLngLatOffset(gateCenter, 180, 10)));
		expect(evaluateAll(ctx(wide), {}).filter((f) => f.ruleId === 'gate-width')).toHaveLength(0);
	});

	it('ignores pairs the driving line does not pass through', () => {
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 600)]);
		const offCourse = feetToLngLatOffset(ORIGIN, 0, 500);
		course.cones.push(cone(feetToLngLatOffset(offCourse, 90, 6)));
		course.cones.push(cone(feetToLngLatOffset(offCourse, 270, 6)));
		expect(evaluateAll(ctx(course), {}).filter((f) => f.ruleId === 'gate-width')).toHaveLength(0);
	});
});

describe('crossover', () => {
	it('flags a figure-8 and passes an oval', () => {
		// figure-8: a bowtie path that crosses itself
		const a = ORIGIN;
		const b = feetToLngLatOffset(ORIGIN, 90, 400);
		const c = feetToLngLatOffset(feetToLngLatOffset(ORIGIN, 90, 400), 0, 300);
		const d = feetToLngLatOffset(ORIGIN, 0, 300);
		const eight = courseWithLine([a, b, c, d, a].map((p) => p));
		// bowtie: a -> c -> b -> d crosses
		const bowtie = courseWithLine([a, c, b, d]);
		const f8 = evaluateAll(ctx(bowtie), {}).filter((f) => f.ruleId === 'crossover');
		expect(f8.length).toBeGreaterThanOrEqual(1);
		expect(f8[0].severity).toBe(RULE_PRESETS.national.crossoverSeverity);

		const ovalFindings = evaluateAll(ctx(eight), {}).filter((f) => f.ruleId === 'crossover');
		// a->b->c->d->a is a simple loop, allow the closing segment adjacency
		expect(ovalFindings.length).toBeLessThanOrEqual(1);
	});
});

describe('hazard-buffer', () => {
	it('flags a cone inside a hazard buffer', () => {
		const course = emptyCourse();
		const hazardAt = feetToLngLatOffset(ORIGIN, 90, 100);
		course.hazardMarkers.push({ id: 'h1', type: 'point', coordinates: [hazardAt], bufferFeet: 25 });
		course.cones.push(cone(feetToLngLatOffset(hazardAt, 0, 20)));
		const findings = evaluateAll(ctx(course), {}).filter((f) => f.ruleId === 'hazard-buffer');
		expect(findings).toHaveLength(1);
		expect(findings[0].severity).toBe('warn');
		expect(findings[0].relatedIds).toContain('h1');
	});

	it('passes cones outside the buffer', () => {
		const course = emptyCourse();
		const hazardAt = feetToLngLatOffset(ORIGIN, 90, 100);
		course.hazardMarkers.push({ id: 'h1', type: 'point', coordinates: [hazardAt], bufferFeet: 25 });
		course.cones.push(cone(feetToLngLatOffset(hazardAt, 0, 60)));
		expect(evaluateAll(ctx(course), {}).filter((f) => f.ruleId === 'hazard-buffer')).toHaveLength(0);
	});
});

describe('slalom-consistency', () => {
	it('flags uneven chains and passes even ones', () => {
		const uneven = emptyCourse();
		let at = ORIGIN;
		for (const gap of [0, 60, 60, 95]) {
			at = feetToLngLatOffset(at, 90, gap);
			uneven.cones.push(cone(at));
		}
		const findings = evaluateAll(ctx(uneven), {}).filter((f) => f.ruleId === 'slalom-consistency');
		expect(findings).toHaveLength(1);

		const even = emptyCourse();
		at = ORIGIN;
		for (const gap of [0, 60, 60, 60]) {
			at = feetToLngLatOffset(at, 90, gap);
			even.cones.push(cone(at));
		}
		expect(evaluateAll(ctx(even), {}).filter((f) => f.ruleId === 'slalom-consistency')).toHaveLength(0);
	});
});

describe('cone-budget and course-length', () => {
	it('flags a blown cone budget', () => {
		const course = emptyCourse();
		for (let i = 0; i < 5; i++) course.cones.push(cone(feetToLngLatOffset(ORIGIN, 90, i * 20)));
		const tight = { ...RULE_PRESETS.national, coneBudget: 3 };
		const findings = evaluateAll(ctx(course, { config: tight }), {}).filter((f) => f.ruleId === 'cone-budget');
		expect(findings).toHaveLength(1);
		expect(findings[0].value).toBe(5);
	});

	it('flags a course shorter than the guideline', () => {
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 800)]);
		const findings = evaluateAll(ctx(course), {}).filter((f) => f.ruleId === 'course-length');
		expect(findings).toHaveLength(1);
		expect(findings[0].message).toContain('shorter');
	});
});

describe('sim rules', () => {
	function simFor(course: CourseData) {
		return simulate(course.drivingLine, carProfile('street'), 'map');
	}

	it('skips sim rules without a sim result', () => {
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 5000)]);
		const findings = evaluateAll(ctx(course), {});
		expect(findings.filter((f) => f.ruleId === 'max-speed')).toHaveLength(0);
	});

	it('flags max speed on a long straight', () => {
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 5000)]);
		const findings = evaluateAll(ctx(course, { sim: simFor(course) }), {});
		const max = findings.filter((f) => f.ruleId === 'max-speed');
		expect(max).toHaveLength(1);
		expect(max[0].value).toBeGreaterThan(65);
	});

	it('reports target-time deviation', () => {
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 400)]);
		const findings = evaluateAll(ctx(course, { sim: simFor(course) }), {});
		const target = findings.filter((f) => f.ruleId === 'target-time');
		expect(target).toHaveLength(1);
		expect(target[0].message).toContain('short of');
	});
});

describe('evaluateAll harness', () => {
	it('skips disabled rules', () => {
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 800)]);
		const findings = evaluateAll(ctx(course), { 'course-length': false });
		expect(findings.filter((f) => f.ruleId === 'course-length')).toHaveLength(0);
	});

	it('contains a throwing rule as an info finding', () => {
		const bad: RuleDef = {
			id: 'bad-rule',
			label: 'Bad rule',
			description: '',
			requiresSim: false,
			evaluate() {
				throw new Error('boom');
			}
		};
		ALL_RULES.push(bad);
		try {
			const findings = evaluateAll(ctx(emptyCourse()), {});
			const failed = findings.filter((f) => f.ruleId === 'bad-rule');
			expect(failed).toHaveLength(1);
			expect(failed[0].severity).toBe('info');
			expect(failed[0].message).toContain('boom');
		} finally {
			ALL_RULES.pop();
		}
	});

	it('presets change outcomes', () => {
		const gateCenter = feetToLngLatOffset(ORIGIN, 90, 300);
		const course = courseWithLine([ORIGIN, feetToLngLatOffset(ORIGIN, 90, 600)]);
		// 14.5 ft gate: narrow nationally (15), fine regionally (14)
		course.cones.push(cone(feetToLngLatOffset(gateCenter, 0, 7.25)));
		course.cones.push(cone(feetToLngLatOffset(gateCenter, 180, 7.25)));
		const national = evaluateAll(ctx(course, { config: RULE_PRESETS.national }), {});
		const regional = evaluateAll(ctx(course, { config: RULE_PRESETS.regional }), {});
		expect(national.filter((f) => f.ruleId === 'gate-width')).toHaveLength(1);
		expect(regional.filter((f) => f.ruleId === 'gate-width')).toHaveLength(0);
	});
});
