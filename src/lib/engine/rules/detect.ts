import type { ConeData, LngLat } from '$lib/types/course';
import { makeFrame } from '../planarFrame';

export interface SlalomChain {
	coneIds: string[];
	gapsFt: number[];
}

const MIN_GAP_FT = 30;
const MAX_GAP_FT = 120;
const MAX_BEARING_CHANGE_DEG = 15;
const MIN_CHAIN = 3;

// Greedy chains of regular cones with slalom-like spacing and near-constant
// bearing. Used for slalom-consistency and to exclude chain cones from gate
// detection.
export function detectSlalomChains(
	cones: ConeData[],
	mode: 'map' | 'image',
	feetPerPixel?: number
): SlalomChain[] {
	const regulars = cones.filter((c) => c.type === 'regular');
	if (regulars.length < MIN_CHAIN) return [];
	const frame = makeFrame(regulars[0].lngLat, mode, feetPerPixel);
	if (!frame) return [];

	const pts = new Map(regulars.map((c) => [c.id, frame.toFeet(c.lngLat)]));
	const used = new Set<string>();
	const chains: SlalomChain[] = [];

	const gapFt = (a: string, b: string) => {
		const pa = pts.get(a)!;
		const pb = pts.get(b)!;
		return Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
	};
	const bearing = (a: string, b: string) => {
		const pa = pts.get(a)!;
		const pb = pts.get(b)!;
		return (Math.atan2(pb[0] - pa[0], pb[1] - pa[1]) * 180) / Math.PI;
	};
	const bearingDelta = (b1: number, b2: number) => {
		let d = Math.abs(b1 - b2) % 360;
		if (d > 180) d = 360 - d;
		return d;
	};

	for (const seed of regulars) {
		if (used.has(seed.id)) continue;
		const chain = [seed.id];
		const gaps: number[] = [];
		let current = seed.id;
		let currentBearing: number | null = null;

		for (;;) {
			let best: { id: string; gap: number } | null = null;
			for (const candidate of regulars) {
				if (used.has(candidate.id) || chain.includes(candidate.id)) continue;
				const gap = gapFt(current, candidate.id);
				if (gap < MIN_GAP_FT || gap > MAX_GAP_FT) continue;
				const b = bearing(current, candidate.id);
				if (currentBearing != null && bearingDelta(currentBearing, b) > MAX_BEARING_CHANGE_DEG) continue;
				if (!best || gap < best.gap) best = { id: candidate.id, gap };
			}
			if (!best) break;
			currentBearing = bearing(current, best.id);
			chain.push(best.id);
			gaps.push(best.gap);
			current = best.id;
		}

		if (chain.length >= MIN_CHAIN) {
			chain.forEach((id) => used.add(id));
			chains.push({ coneIds: chain, gapsFt: gaps });
		}
	}
	return chains;
}

// Densify the driving line the same way it renders, in raw coordinates —
// intersection tests are coordinate-agnostic.
export function midpoint(a: LngLat, b: LngLat): LngLat {
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
