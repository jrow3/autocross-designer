import type { RuleDef, RuleFinding } from './types';
import { distanceFeet } from '../geo';
import { catmullRomSpline } from '../catmullRom';
import { segmentsIntersect } from '../coneNumbering';
import { detectSlalomChains, midpoint } from './detect';

const GATE_MIN_FT = 8;
const GATE_MAX_FT = 30;
const START_FINISH_MIN_FT = 12;
const START_FINISH_MAX_FT = 30;

export const startFinishRule: RuleDef = {
	id: 'start-finish',
	label: 'Start / finish gates',
	description: 'The course has start and finish cones, spaced like a drivable gate.',
	requiresSim: false,
	evaluate({ course, mode, feetPerPixel, config }) {
		void config;
		const findings: RuleFinding[] = [];
		for (const type of ['start-cone', 'finish-cone'] as const) {
			const cones = course.cones.filter((c) => c.type === type);
			const label = type === 'start-cone' ? 'start' : 'finish';
			if (cones.length === 0) {
				findings.push({
					ruleId: 'start-finish',
					severity: 'info',
					message: `No ${label} cones placed yet.`,
					relatedIds: [],
					location: null
				});
				continue;
			}
			if (cones.length >= 2) {
				// closest pair spacing should read like a gate
				let best = Infinity;
				let pair: [string, string] = [cones[0].id, cones[1].id];
				let at = cones[0].lngLat;
				for (let i = 0; i < cones.length; i++) {
					for (let j = i + 1; j < cones.length; j++) {
						const d = distanceFeet(cones[i].lngLat, cones[j].lngLat, mode, feetPerPixel);
						if (d != null && d < best) {
							best = d;
							pair = [cones[i].id, cones[j].id];
							at = midpoint(cones[i].lngLat, cones[j].lngLat);
						}
					}
				}
				if (best < START_FINISH_MIN_FT || best > START_FINISH_MAX_FT) {
					findings.push({
						ruleId: 'start-finish',
						severity: 'warn',
						message: `The ${label} gate is ${best.toFixed(0)} ft wide — aim for ${START_FINISH_MIN_FT}–${START_FINISH_MAX_FT} ft.`,
						relatedIds: [...pair],
						location: at,
						value: best,
						limit: START_FINISH_MIN_FT
					});
				}
			}
		}
		return findings;
	}
};

export const gateWidthRule: RuleDef = {
	id: 'gate-width',
	label: 'Gate width',
	description: 'Cone pairs the driving line passes through are wide enough.',
	requiresSim: false,
	evaluate({ course, mode, feetPerPixel, config }) {
		const line = course.drivingLine.map((wp) => wp.lngLat);
		if (line.length < 2) return [];
		const dense = catmullRomSpline(line, 8);

		const chainCones = new Set(
			detectSlalomChains(course.cones, mode, feetPerPixel).flatMap((c) => c.coneIds)
		);
		const candidates = course.cones.filter(
			(c) => c.type !== 'pointer' && c.type !== 'trailer' && c.type !== 'staging-grid' && !chainCones.has(c.id)
		);

		const findings: RuleFinding[] = [];
		const claimed = new Set<string>();
		for (let i = 0; i < candidates.length; i++) {
			for (let j = i + 1; j < candidates.length; j++) {
				const a = candidates[i];
				const b = candidates[j];
				if (claimed.has(a.id) || claimed.has(b.id)) continue;
				const width = distanceFeet(a.lngLat, b.lngLat, mode, feetPerPixel);
				if (width == null || width < GATE_MIN_FT || width > GATE_MAX_FT) continue;

				// a gate exists when the driving line crosses the pair's connecting segment
				let crossed = false;
				for (let k = 1; k < dense.length && !crossed; k++) {
					crossed = segmentsIntersect(a.lngLat, b.lngLat, dense[k - 1], dense[k]);
				}
				if (!crossed) continue;

				claimed.add(a.id);
				claimed.add(b.id);
				if (width < config.minGateWidthFt) {
					findings.push({
						ruleId: 'gate-width',
						severity: 'warn',
						message: `A ${width.toFixed(1)} ft gate is narrower than the ${config.minGateWidthFt} ft guideline.`,
						relatedIds: [a.id, b.id],
						location: midpoint(a.lngLat, b.lngLat),
						value: width,
						limit: config.minGateWidthFt
					});
				}
			}
		}
		return findings;
	}
};
