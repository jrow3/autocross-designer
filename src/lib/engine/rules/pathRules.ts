import type { RuleDef, RuleFinding } from './types';
import { catmullRomSpline } from '../catmullRom';
import { segmentsIntersect } from '../coneNumbering';
import { splineLengthFeet } from '../courseStats';
import { midpoint } from './detect';

const MAX_CROSSOVER_SEGMENTS = 600;

export const crossoverRule: RuleDef = {
	id: 'crossover',
	label: 'No crossovers',
	description: 'The driving line does not cross itself.',
	requiresSim: false,
	evaluate({ course, config }) {
		const line = course.drivingLine.map((wp) => wp.lngLat);
		if (line.length < 4) return [];
		let dense = catmullRomSpline(line, 8);
		if (dense.length > MAX_CROSSOVER_SEGMENTS) {
			const step = Math.ceil(dense.length / MAX_CROSSOVER_SEGMENTS);
			dense = dense.filter((_, i) => i % step === 0 || i === dense.length - 1);
		}

		const findings: RuleFinding[] = [];
		for (let i = 1; i < dense.length; i++) {
			// skip adjacent segments — they share an endpoint
			for (let j = i + 2; j < dense.length; j++) {
				if (segmentsIntersect(dense[i - 1], dense[i], dense[j - 1], dense[j])) {
					findings.push({
						ruleId: 'crossover',
						severity: config.crossoverSeverity,
						message: 'The driving line crosses itself — crossovers need a worker with a flag.',
						relatedIds: [],
						location: midpoint(dense[i - 1], dense[j])
					});
					return findings; // one report is enough
				}
			}
		}
		return findings;
	}
};

export const courseLengthRule: RuleDef = {
	id: 'course-length',
	label: 'Course length',
	description: 'Total length lands in the expected range for the event type.',
	requiresSim: false,
	evaluate({ course, mode, feetPerPixel, config }) {
		if (course.drivingLine.length < 2) return [];
		const length = splineLengthFeet(course, mode, feetPerPixel);
		if (length == null || length === 0) return [];
		if (length < config.minCourseLengthFt) {
			return [{
				ruleId: 'course-length',
				severity: 'info',
				message: `Course is ${length.toFixed(0)} ft — shorter than the ~${config.minCourseLengthFt} ft guideline.`,
				relatedIds: [],
				location: null,
				value: length,
				limit: config.minCourseLengthFt
			}];
		}
		if (length > config.maxCourseLengthFt) {
			return [{
				ruleId: 'course-length',
				severity: 'info',
				message: `Course is ${length.toFixed(0)} ft — longer than the ~${config.maxCourseLengthFt} ft guideline.`,
				relatedIds: [],
				location: null,
				value: length,
				limit: config.maxCourseLengthFt
			}];
		}
		return [];
	}
};
