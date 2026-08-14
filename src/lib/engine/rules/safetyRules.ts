import type { RuleDef, RuleFinding } from './types';
import { catmullRomSpline } from '../catmullRom';
import { distanceFeet } from '../geo';
import { pointToPolylineFeet } from '../geoDistance';
import { detectSlalomChains } from './detect';

export const hazardBufferRule: RuleDef = {
	id: 'hazard-buffer',
	label: 'Hazard buffers',
	description: 'No cone or driving line inside a hazard safety buffer.',
	requiresSim: false,
	evaluate({ course, mode, feetPerPixel }) {
		const findings: RuleFinding[] = [];
		if (course.hazardMarkers.length === 0) return findings;

		const checkPoint = (
			point: [number, number],
			label: string,
			relatedIds: string[]
		): void => {
			for (const hazard of course.hazardMarkers) {
				const d =
					hazard.type === 'point'
						? distanceFeet(point, hazard.coordinates[0], mode, feetPerPixel)
						: pointToPolylineFeet(point, hazard.coordinates, mode, feetPerPixel);
				if (d != null && d < hazard.bufferFeet) {
					findings.push({
						ruleId: 'hazard-buffer',
						severity: 'warn',
						message: `${label} sits ${d.toFixed(0)} ft from a hazard with a ${hazard.bufferFeet} ft buffer.`,
						relatedIds: [...relatedIds, hazard.id],
						location: point,
						value: d,
						limit: hazard.bufferFeet
					});
					return; // one finding per element is enough
				}
			}
		};

		for (const cone of course.cones) {
			checkPoint(cone.lngLat, 'A cone', [cone.id]);
		}

		const line = course.drivingLine.map((wp) => wp.lngLat);
		if (line.length >= 2) {
			const dense = catmullRomSpline(line, 4);
			for (let i = 0; i < dense.length; i += 3) {
				const before = findings.length;
				checkPoint(dense[i], 'The driving line', []);
				if (findings.length > before) break; // one line report is enough
			}
		}
		return findings;
	}
};

export const coneBudgetRule: RuleDef = {
	id: 'cone-budget',
	label: 'Cone budget',
	description: 'Cone count stays within the club inventory.',
	requiresSim: false,
	evaluate({ course, config }) {
		const count = course.cones.length;
		if (count <= config.coneBudget) return [];
		return [{
			ruleId: 'cone-budget',
			severity: 'info',
			message: `${count} cones placed — over the ${config.coneBudget} cone budget.`,
			relatedIds: [],
			location: null,
			value: count,
			limit: config.coneBudget
		}];
	}
};

export const slalomConsistencyRule: RuleDef = {
	id: 'slalom-consistency',
	label: 'Slalom spacing',
	description: 'Cones within a slalom keep near-even spacing.',
	requiresSim: false,
	evaluate({ course, mode, feetPerPixel, config }) {
		const findings: RuleFinding[] = [];
		for (const chain of detectSlalomChains(course.cones, mode, feetPerPixel)) {
			const gaps = chain.gapsFt;
			const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
			const maxDev = Math.max(...gaps.map((g) => Math.abs(g - mean)));
			if ((maxDev / mean) * 100 > config.slalomSpacingTolerancePct) {
				const min = Math.min(...gaps);
				const max = Math.max(...gaps);
				const anchor = course.cones.find((c) => c.id === chain.coneIds[0]);
				findings.push({
					ruleId: 'slalom-consistency',
					severity: 'info',
					message: `Slalom spacing varies ${min.toFixed(0)}–${max.toFixed(0)} ft — drivers read slaloms as even.`,
					relatedIds: chain.coneIds,
					location: anchor?.lngLat ?? null,
					value: (maxDev / mean) * 100,
					limit: config.slalomSpacingTolerancePct
				});
			}
		}
		return findings;
	}
};
