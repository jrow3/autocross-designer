import type { RuleDef, RuleFinding } from './types';
import { pointToSegmentFeet } from '../geoDistance';
import { makeFrame } from '../planarFrame';

const G = 32.174;
const MPH_TO_FTS = 1 / 0.681818;
const RUNOUT_CORRIDOR_FT = 25;

export const maxSpeedRule: RuleDef = {
	id: 'max-speed',
	label: 'Max speed',
	description: 'Modeled top speed stays under the event guideline.',
	requiresSim: true,
	evaluate({ sim, config }) {
		if (!sim) return [];
		if (sim.maxSpeedMph <= config.maxSpeedMph) return [];
		return [{
			ruleId: 'max-speed',
			severity: 'warn',
			message: `Modeled top speed is ${sim.maxSpeedMph.toFixed(0)} mph — over the ${config.maxSpeedMph} mph guideline. Break up the straight.`,
			relatedIds: [],
			location: sim.maxSpeedLocation,
			value: sim.maxSpeedMph,
			limit: config.maxSpeedMph
		}];
	}
};

export const finishRunoutRule: RuleDef = {
	id: 'finish-runout',
	label: 'Finish runout',
	description: 'Enough clear stopping room past the finish.',
	requiresSim: true,
	evaluate({ course, sim, mode, feetPerPixel, config }) {
		if (!sim || sim.points.length < 2) return [];
		const last = sim.points[sim.points.length - 1];
		const prev = sim.points[sim.points.length - 2];
		const finishSpeedFts = last.speedMph * MPH_TO_FTS;
		const stoppingFt = (finishSpeedFts * finishSpeedFts) / (2 * 0.9 * G);
		const runoutFt = Math.max(stoppingFt, config.finishRunoutFt);

		if (course.hazardMarkers.length === 0) {
			return [{
				ruleId: 'finish-runout',
				severity: 'info',
				message: `Cars cross the finish at ~${last.speedMph.toFixed(0)} mph and need ~${runoutFt.toFixed(0)} ft of runout — no venue hazards mapped to verify against.`,
				relatedIds: [],
				location: last.lngLat,
				value: runoutFt
			}];
		}

		// project the runout ray past the finish along the final tangent
		const frame = makeFrame(last.lngLat, mode, feetPerPixel);
		if (!frame) return [];
		const [px, py] = frame.toFeet(prev.lngLat);
		const len = Math.hypot(px, py);
		if (len === 0) return [];
		const end = frame.fromFeet([(-px / len) * runoutFt, (-py / len) * runoutFt]);

		const findings: RuleFinding[] = [];
		for (const hazard of course.hazardMarkers) {
			for (const coord of hazard.coordinates) {
				const d = pointToSegmentFeet(coord, last.lngLat, end, mode, feetPerPixel);
				if (d != null && d < RUNOUT_CORRIDOR_FT + hazard.bufferFeet) {
					findings.push({
						ruleId: 'finish-runout',
						severity: 'warn',
						message: `A hazard sits in the finish runout — cars need ~${runoutFt.toFixed(0)} ft to stop from ${last.speedMph.toFixed(0)} mph.`,
						relatedIds: [hazard.id],
						location: coord,
						value: d,
						limit: runoutFt
					});
					break;
				}
			}
		}
		return findings;
	}
};

export const straightIntoCornerRule: RuleDef = {
	id: 'straight-into-corner',
	label: 'Straight into tight corner',
	description: 'Flags long straights that end in very tight corners.',
	requiresSim: true,
	evaluate({ sim }) {
		if (!sim) return [];
		const findings: RuleFinding[] = [];
		for (let i = 0; i < sim.segments.length - 1; i++) {
			const straight = sim.segments[i];
			const corner = sim.segments[i + 1];
			if (straight.kind !== 'straight' || corner.kind !== 'corner') continue;
			if (straight.lengthFt >= 250 && corner.minRadiusFt <= 50) {
				const dir = corner.turnSign > 0 ? 'left' : corner.turnSign < 0 ? 'right' : 'turn';
				findings.push({
					ruleId: 'straight-into-corner',
					severity: 'info',
					message: `A ${straight.lengthFt.toFixed(0)} ft straight ends in a ${corner.minRadiusFt.toFixed(0)} ft radius ${dir} — expect heavy braking.`,
					relatedIds: [],
					location: sim.points[corner.startIdx]?.lngLat ?? null,
					value: straight.lengthFt
				});
			}
		}
		return findings;
	}
};

export const targetTimeRule: RuleDef = {
	id: 'target-time',
	label: 'Target run time',
	description: 'Estimated run time compared to the target.',
	requiresSim: true,
	evaluate({ sim, config }) {
		if (!sim) return [];
		const delta = sim.timeSec - config.targetTimeSec;
		if (Math.abs(delta) <= config.targetTimeSec * 0.2) return [];
		const direction = delta > 0 ? 'over' : 'short of';
		return [{
			ruleId: 'target-time',
			severity: 'info',
			message: `Estimated run is ${sim.timeSec.toFixed(1)} s — ${direction} the ~${config.targetTimeSec} s target.`,
			relatedIds: [],
			location: null,
			value: sim.timeSec,
			limit: config.targetTimeSec
		}];
	}
};
